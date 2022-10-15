require('dotenv').config();

const stopWord = require('../../util/stopWord');
const synonym = require('../../util/synonym');
const { Article, Articles } = require('../../util/article');
const {
  findMatchedSentence,
  calculateSimilarity,
} = require('../../util/compare');

const Graph = require('graph-data-structure');

const {
  insertArticles,
  insertCompareResult,
  searchArticle,
  searchArticlesByTag,
  searchArticleById,
  getCompareResult,
} = require('../models/article');

const { cache } = require('../../util/cache');

const {
  MODE_SINGLE,
  MODE_MULTIPLE,
  MODE_UPLOAD,
  // MATCH_PENDING,
  // MATCH_FINISHED,
  DB_ARTICLE_INDEX,
  LENGTHY_ARTICLE_THRESHOLD,
  MUTIPLE_THRESHOLD,
  UPLOAD_RESPONSE_THRESHOLD,
  UPLOAD_RESPONSE_MIN_SIMILARITY,
  PAGE_SIZE,
} = process.env;

const comparison = async (req, res, next) => {
  const articles = new Articles();
  const { sourceArticle, targetArticle } = req.body.data;

  articles.newArticle(
    sourceArticle.title,
    sourceArticle.author,
    sourceArticle.content
  );

  articles.newArticle(
    targetArticle.title,
    targetArticle.author,
    targetArticle.content
  );

  const [source, target] = articles.all;

  const hasLongArticle =
    sourceArticle.content.length >= +LENGTHY_ARTICLE_THRESHOLD ||
    targetArticle.content.length >= +LENGTHY_ARTICLE_THRESHOLD;

  if (cache.ready && hasLongArticle) {
    const insertArtile = [
      {
        index: {
          _index: DB_ARTICLE_INDEX,
        },
      },
      {
        title: source.title,
        author: source.author,
        content: source.content,
        user_id: req.user.user_id,
        create_time: Date.now(),
      },
      {
        index: {
          _index: DB_ARTICLE_INDEX,
        },
      },
      {
        title: target.title,
        author: target.author,
        content: target.content,
        user_id: req.user.user_id,
        create_time: Date.now(),
      },
    ];

    const insertArticlesResult = await insertArticles(insertArtile);

    const compareResult = {
      user_id: req.user.user_id,
      compare_mode: +MODE_SINGLE,
      match_result: [
        {
          source_id: insertArticlesResult.items[0].index._id,
          target_id: insertArticlesResult.items[1].index._id,
        },
      ],
      create_time: Date.now(),
    };

    const compareResultResponse = await insertCompareResult(compareResult);

    try {
      await cache.lpush(
        'chinese-article-compare',
        JSON.stringify({
          user_id: req.user.user_id,
          compare_mode: +MODE_SINGLE,
          compare_result_id: compareResultResponse._id,
          source_id: insertArticlesResult.items[0].index._id,
          target_id: insertArticlesResult.items[1].index._id,
          source,
          target,
        })
      );

      return res
        .status(200)
        .send({ status_code: 200, data: null, message: '文章比對進行中' });
    } catch (error) {
      console.log(error);
      return res.send('redis error');
    }
  }

  // article preprocessing
  articles.all.forEach((element) => {
    element.extractTag().splitSentence().tokenizer();
    element.filtered = stopWord.filterStopWords(element.tokens);
    element.synonym = synonym.findSynonym(element.filtered);
  });

  try {
    const insertArticle = [
      {
        index: {
          _index: DB_ARTICLE_INDEX,
        },
      },
      {
        title: source.title,
        author: source.author,
        content: source.content,
        processed_content: source.synonym,
        tag: source.tags,
        user_id: req.user.user_id,
        create_time: Date.now(),
      },
      {
        index: {
          _index: DB_ARTICLE_INDEX,
        },
      },
      {
        title: target.title,
        author: target.author,
        content: target.content,
        processed_content: target.synonym,
        tag: target.tags,
        user_id: req.user.user_id,
        create_time: Date.now(),
      },
    ];

    const insertArticlesResult = await insertArticles(insertArticle);

    console.log(insertArticlesResult.items);

    const articleSimilarity = calculateSimilarity(
      source.synonym.flat(),
      target.synonym.flat()
    );

    const result = findMatchedSentence(
      source.sentences,
      target.sentences,
      source.synonym,
      target.synonym
    );

    const compareResult = {
      user_id: req.user.user_id,
      compare_mode: +MODE_SINGLE,
      match_result: [
        {
          similarity: articleSimilarity,
          source_id: insertArticlesResult.items[0].index._id,
          target_id: insertArticlesResult.items[1].index._id,
          sentences: result,
        },
      ],
      create_time: Date.now(),
    };

    await insertCompareResult(compareResult);

    res.status(200).send({
      data: {
        similarity: articleSimilarity,
        matchResult: result,
      },
    });
  } catch (err) {
    console.log(err);
    next();
  }
};

const multipleComparison = async (req, res) => {
  let articles = new Articles();

  const insertedArticles = [];

  req.body.data.forEach((element) => {
    // article preprocessing
    const article = articles.newArticle(
      element.title,
      element.author,
      element.content
    );

    // prepare data to insert into database
    insertedArticles.push(
      {
        index: {
          _index: DB_ARTICLE_INDEX,
        },
      },
      {
        title: article.title,
        author: article.author,
        content: article.content,
        user_id: req.user.user_id,
        create_time: Date.now(),
      }
    );
  });

  const hasTimeConsumingJob = req.body.data.length >= +MUTIPLE_THRESHOLD;
  const hasLenthyContent = articles.checkLengthyContent();

  if (cache.ready && (hasTimeConsumingJob || hasLenthyContent)) {
    const insertArticlesResult = await insertArticles(insertedArticles);

    for (let i = 0; i < articles.numberOfArticles; i++) {
      articles.all[i].id = insertArticlesResult.items[i].index._id;
    }

    await cache.lpush(
      'chinese-article-compare',
      JSON.stringify({
        user_id: req.user.user_id,
        compare_mode: +MODE_MULTIPLE,
        articles: articles.all,
      })
    );

    return res
      .status(200)
      .send({ status_code: 200, data: null, message: '文章比對進行中' });
  }

  articles.all.forEach((article) => {
    // article preprocessing
    // const article = articles.newArticle(
    //   element.title,
    //   element.author,
    //   element.content
    // );

    article.extractTag().splitSentence().tokenizer();
    article.filtered = stopWord.filterStopWords(article.tokens);
    article.synonym = synonym.findSynonym(article.filtered);

    // prepare data to insert into database
    insertedArticles.push(
      {
        index: {
          _index: DB_ARTICLE_INDEX,
        },
      },
      {
        title: article.title,
        author: article.author,
        content: article.content,
        processed_content: article.synonym,
        tag: article.tags,
        user_id: req.user.user_id,
        create_time: Date.now(),
      }
    );
  });

  const insertArticlesResult = await insertArticles(insertedArticles);

  for (let i = 0; i < articles.numberOfArticles; i++) {
    articles.all[i].id = insertArticlesResult.items[i].index._id;
  }

  const articlesGraph = Graph();
  const matchedArticles = {};

  const compareResult = [];

  // article comparison
  for (let i = 0; i < articles.numberOfArticles; i += 1) {
    for (let j = i + 1; j < articles.numberOfArticles; j += 1) {
      const similarity = calculateSimilarity(
        articles.all[i].synonym.flat(),
        articles.all[j].synonym.flat()
      );

      articlesGraph.addEdge(i + 1, j + 1, similarity);

      // find matched sentences between two articles
      const matchResult = findMatchedSentence(
        articles.all[i].sentences,
        articles.all[j].sentences,
        articles.all[i].synonym,
        articles.all[j].synonym
      );

      matchedArticles[`${i + 1}-and-${j + 1}`] = {
        similarity,
        source_id: articles.all[i].id,
        target_id: articles.all[j].id,
        sentences: matchResult,
      };

      compareResult.push(matchedArticles[`${i + 1}-and-${j + 1}`]);
    }
  }

  await insertCompareResult({
    user_id: req.user.user_id,
    compare_mode: +MODE_MULTIPLE,
    match_result: compareResult,
    create_time: Date.now(),
  });

  console.log(matchedArticles);

  res.send({
    data: {
      similarity: articlesGraph.serialize(),
      matchResult: matchedArticles,
    },
  });
};

const analyzeArticle = async (req, res) => {
  const { title, author, content } = req.body.data;
  const article = new Article(title, author, content);

  const hasLongArticle = content.length >= +LENGTHY_ARTICLE_THRESHOLD;

  if (cache.ready && hasLongArticle) {
    const insertResult = await insertArticles([
      {
        index: {
          _index: DB_ARTICLE_INDEX,
        },
      },
      {
        title: article.title,
        author: article.author,
        content: article.content,
        user_id: req.user.user_id,
        create_time: Date.now(),
      },
    ]);

    // console.log(insertResult.items[0].index);

    article.id = insertResult.items[0].index._id;

    console.log(article.id);

    await cache.lpush(
      'chinese-article-compare',
      JSON.stringify({
        user_id: req.user.user_id,
        compare_mode: +MODE_UPLOAD,
        article,
      })
    );

    return res
      .status(200)
      .send({ status_code: 200, data: null, message: '文章比對進行中' });
  }

  article.extractTag().splitSentence().tokenizer();
  article.filtered = stopWord.filterStopWords(article.tokens);
  article.synonym = synonym.findSynonym(article.filtered);

  const insertResult = await insertArticles([
    {
      index: {
        _index: DB_ARTICLE_INDEX,
      },
    },
    {
      title: article.title,
      author: article.author,
      content: article.content,
      processed_content: article.synonym,
      tag: article.tags,
      user_id: req.user.user_id,
      create_time: Date.now(),
    },
  ]);

  const searchTags = [];
  article.tags.forEach((element) => {
    searchTags.push({ match: { tag: element } });
  });

  const responseSize = +UPLOAD_RESPONSE_THRESHOLD;
  const searchResponse = await searchArticlesByTag(responseSize, searchTags);

  console.log(searchResponse.hits.hits);

  const articleSimilarities = [];
  const similarArticles = [];
  const matchResult = [];
  const compareResult = [];

  for (
    let i = 0;
    i < Math.min(searchResponse.hits.total.value, responseSize);
    i += 1
  ) {
    const articleSimilarity = calculateSimilarity(
      article.synonym.flat(),
      searchResponse.hits.hits[i]._source.processed_content.flat()
    );

    let { title, author, content, processed_content } =
      searchResponse.hits.hits[i]._source;

    let compareArticle = new Article(title, author, content);
    compareArticle.splitSentence();

    let result = findMatchedSentence(
      article.sentences,
      compareArticle.sentences,
      article.synonym,
      processed_content
    );

    if (articleSimilarity >= +UPLOAD_RESPONSE_MIN_SIMILARITY) {
      articleSimilarities.push(articleSimilarity);

      similarArticles.push({
        title,
        author,
        content,
      });

      matchResult.push(result);
    }

    compareResult.push({
      similarity: articleSimilarity,
      source_id: insertResult.items[0].index._id,
      target_id: searchResponse.hits.hits[i]._id,
      sentences: result,
    });
  }

  await insertCompareResult({
    user_id: req.user.user_id,
    compare_mode: +MODE_UPLOAD,
    match_result: compareResult,
    create_time: Date.now(),
  });

  res.send({
    data: {
      similarity: articleSimilarities,
      matchResult,
      article: similarArticles,
    },
  });
};

const getArticles = async (req, res) => {
  const esSearchQuery = {
    must_not: [],
    should: [],
  };
  const { page } = req.query;
  const searchConditions = req.query.key.split(' ');
  console.log(searchConditions);

  if (searchConditions.length > 0) {
    searchConditions.forEach((element) => {
      if (element[0] === '-') {
        esSearchQuery.must_not.push({
          multi_match: { query: element.substring(1) },
        });
      } else {
        esSearchQuery.should.push({ multi_match: { query: element } });
      }
    });
  }

  console.log(esSearchQuery);

  const searchResult = await searchArticle(page, +PAGE_SIZE, esSearchQuery);

  console.log(searchResult.hits.hits);

  const searchArticleResult = searchResult.hits.hits.map((element) => ({
    id: element._id,
    title: element._source.title,
    author: element._source.author,
    content: element._source.content,
  }));
  const response = {
    total: searchResult.hits.total.value,
    article: searchArticleResult,
  };
  res.send({ data: response });
};

const getArticleDetails = async (req, res) => {
  const { id } = req.query;
  const result = await searchArticleById(id);

  const response = {
    title: result.hits.hits[0]._source.title,
    author: result.hits.hits[0]._source.author,
    content: result.hits.hits[0]._source.content,
  };
  res.status(200).send({ data: response });
};

function compare(a, b) {
  if (a.similarity < b.similarity) return 1;
  if (a.similarity > b.similarity) return -1;
  return 0;
}

const getArticleRecords = async (req, res) => {
  const { page } = req.query;
  const compareResults = await getCompareResult(
    req.user.user_id,
    +PAGE_SIZE,
    +page
  );
  const searchArticles = [];

  // only show compare result with highest similarity (with multiple and upload mode)
  let highestSimilaityResult = compareResults.hits.hits.map((element) => {
    element._source.match_result.sort(compare);
    element._source.match_result = element._source.match_result.shift();
    return element._source;
  });

  // console.log('highestSimilaityResult', highestSimilaityResult);

  // prepare for search articles
  highestSimilaityResult.forEach((element) => {
    searchArticles.push(searchArticleById(element.match_result.source_id));
    searchArticles.push(searchArticleById(element.match_result.target_id));
  });

  // console.log('searchArticles', searchArticles);

  let articleResult = await Promise.all(searchArticles);

  // console.log('article result', articleResult);

  // organize article result to hash table
  articleResult = articleResult.reduce((accu, curr) => {
    accu[curr.hits.hits[0]._id] = {
      id: curr.hits.hits[0]._id,
      title: curr.hits.hits[0]._source.title,
      author: curr.hits.hits[0]._source.author,
      content: curr.hits.hits[0]._source.content,
    };
    return accu;
  }, {});

  // map source article and target article to result
  highestSimilaityResult = highestSimilaityResult.map((element) => {
    element.source_article = articleResult[element.match_result.source_id];
    element.target_article = articleResult[element.match_result.target_id];
    return element;
  });

  res.status(200).send({
    data: {
      totalRecords: compareResults.hits.total.value,
      highestSimilaityResult,
    },
  });
};

module.exports = {
  comparison,
  multipleComparison,
  getArticles,
  analyzeArticle,
  getArticleDetails,
  getArticleRecords,
};