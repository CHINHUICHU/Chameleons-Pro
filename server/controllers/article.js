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

const { generateTag } = require('../../util/generateTag');

const {
  MODE_SINGLE,
  MODE_MULTIPLE,
  MODE_UPLOAD,
  DB_ARTICLE_INDEX,
  UPLOAD_RESPONSE_THRESHOLD,
  UPLOAD_RESPONSE_MIN_SIMILARITY,
  PAGE_SIZE,
  LENGTHY_ARTICLE_THRESHOLD,
  COMPARE_FINISH,
  // COMPARE_PENDING,
} = process.env;

const comparison = async (req, res, next) => {
  console.time('test');
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
      },
    ];

    const insertArticlesResult = await insertArticles(insertArtile);

    source.id = insertArticlesResult.items[0].index._id;
    target.id = insertArticlesResult.items[1].index._id;

    try {
      await cache.lpush(
        'chinese-article-compare',
        JSON.stringify({
          user_id: req.user.user_id,
          compare_mode: +MODE_SINGLE,
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

  console.timeEnd('test');

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
      },
    ];

    const insertArticlesResult = await insertArticles(insertArticle);

    // console.log(insertArticlesResult.items);

    const articleSimilarity = calculateSimilarity(
      source.synonym.flat(),
      target.synonym.flat()
    );

    const result = findMatchedSentence(source.synonym, target.synonym);

    const compareResult = {
      user_id: req.user.user_id,
      compare_mode: +MODE_SINGLE,
      match_result: [
        {
          similarity: articleSimilarity,
          source_id: insertArticlesResult.items[0].index._id,
          target_id: insertArticlesResult.items[1].index._id,
          sentences: result,
          status: +COMPARE_FINISH,
        },
      ],
    };

    await insertCompareResult(compareResult);

    // generate HTML tag
    const markedSourceContent = generateTag(source.sentences, result.source);
    const markedTargetContent = generateTag(target.sentences, result.target);

    res.send('ok');

    // res.status(200).send({
    //   data: {
    //     similarity: articleSimilarity,
    //     markedSourceContent,
    //     markedTargetContent,
    //   },
    // });
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
      }
    );
  });

  articles.all.forEach((article) => {
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
        articles.all[i].synonym,
        articles.all[j].synonym
      );

      matchedArticles[`${i + 1}-and-${j + 1}`] = {
        source: generateTag(articles.all[i].sentences, matchResult.source),
        target: generateTag(articles.all[j].sentences, matchResult.target),
      };

      compareResult.push({
        similarity,
        sentences: matchResult,
        target_id: articles.all[j].id,
        source_id: articles.all[i].id,
        status: COMPARE_FINISH,
      });
    }
  }

  await insertCompareResult({
    user_id: req.user.user_id,
    compare_mode: +MODE_MULTIPLE,
    match_result: compareResult,
  });

  res.send('ok');

  // res.send({
  //   data: {
  //     similarity: articlesGraph.serialize(),
  //     matchResult: matchedArticles,
  //   },
  // });
};

const analyzeArticle = async (req, res) => {
  const { title, author, content } = req.body.data;
  const article = new Article(title, author, content);

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
    },
  ]);

  const searchTags = [];
  article.tags.forEach((element) => {
    searchTags.push({ match: { tag: element } });
  });

  const responseSize = +UPLOAD_RESPONSE_THRESHOLD;
  const searchResponse = await searchArticlesByTag(responseSize, searchTags);

  // console.log(searchResponse.hits.hits);

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

    let result = findMatchedSentence(article.synonym, processed_content);

    // console.log('result', result);

    if (articleSimilarity >= +UPLOAD_RESPONSE_MIN_SIMILARITY) {
      articleSimilarities.push(articleSimilarity);

      similarArticles.push({
        title,
        author,
      });

      matchResult.push({
        source: generateTag(article.sentences, result.source),
        target: generateTag(
          content.split(/(?=，|。|\n|！|？|：|；)+/),
          result.target
        ),
      });
    }

    // console.log(matchResult);

    compareResult.push({
      similarity: articleSimilarity,
      source_id: insertResult.items[0].index._id,
      target_id: searchResponse.hits.hits[i]._id,
      sentences: result,
      status: +COMPARE_FINISH,
    });
  }

  await insertCompareResult({
    user_id: req.user.user_id,
    compare_mode: +MODE_UPLOAD,
    match_result: compareResult,
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
  // console.log(searchConditions);

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

  // console.log(esSearchQuery);

  const searchResult = await searchArticle(page, +PAGE_SIZE, esSearchQuery);

  // console.log(searchResult.hits.hits);

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

  // console.log(
  //   'compareResults',
  //   compareResults.hits.hits[0]._source.match_result
  // );

  const searchArticles = [];

  // only show compare result with highest similarity (with multiple and upload mode)
  let highestSimilaityResult = compareResults.hits.hits.map((element) => {
    element._source.match_result.sort(compare);
    element._source.match_result = element._source.match_result.shift();
    return element._source;
  });

  // prepare for search articles
  highestSimilaityResult.forEach((element) => {
    searchArticles.push(searchArticleById(element.match_result.source_id));
    searchArticles.push(searchArticleById(element.match_result.target_id));
  });

  let articleResult = await Promise.all(searchArticles);

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
    element.source_article.content = generateTag(
      element.source_article.content.split(/(?=，|。|\n|！|？|：|；)+/),
      element.match_result.sentences.source
    );
    element.target_article = articleResult[element.match_result.target_id];
    element.target_article.content = generateTag(
      element.target_article.content.split(/(?=，|。|\n|！|？|：|；)+/),
      element.match_result.sentences.target
    );
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
