require('dotenv').config();
const path = require('path');

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
  MATCH_PENDING,
  MATCH_FINISHED,
  DB_ARTICLE_INDEX,
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

  const isLongArticle =
    sourceArticle.content.length >= 20000 ||
    targetArticle.content.length >= 20000;

  if (cache.ready) {
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
      status: +MATCH_PENDING,
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
      compare_mode: 1,
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

    const response = {
      similarity: articleSimilarity,
      matchResult: result,
    };

    res.send({ data: response });
  } catch (err) {
    console.log(err);
    next();
  }
};

const multipleComparison = async (req, res) => {
  let articles = new Articles();

  const insertedArticles = [];

  // const isTimeConsumingJob = req.body.data.length > 10;

  if (cache.ready) {
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
            _index: process.env.DB_ARTICLE_INDEX,
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

    // const insertArticlesResult = await insertArticles(insertedArticles);

    // for (let i = 0; i < articles.numberOfArticles; i++) {
    //   articles.all[i].id = insertArticlesResult.items[i].index._id;
    // }

    await cache.lpush(
      'chinese-article-compare',
      JSON.stringify({
        user_id: req.user.user_id,
        compare_mode: +MODE_MULTIPLE,
        articles: articles.all,
      })
    );

    return res.send('ok');
  }

  req.body.data.forEach((element) => {
    // article preprocessing
    const article = articles.newArticle(
      element.title,
      element.author,
      element.content
    );

    article.extractTag().splitSentence().tokenizer();
    article.filtered = stopWord.filterStopWords(article.tokens);
    article.synonym = synonym.findSynonym(article.filtered);

    // prepare data to insert into database
    insertedArticles.push(
      {
        index: {
          _index: process.env.DB_ARTICLE_INDEX,
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

      matchedArticles[`${i + 1}-and-${j + 1}`] = matchResult;

      // prepare compare result to insert into database
      compareResult.push({
        index: {
          _index: process.env.DB_COMPARE_INDEX,
        },
      });

      compareResult.push({
        similarity,
        source_id: insertArticlesResult.items[i].index._id,
        target_id: insertArticlesResult.items[j].index._id,
        sentences: matchResult,
      });
    }
  }

  await insertCompareResult({
    user_id: req.user.user_id,
    compare_mode: +MODE_MULTIPLE,
    match_result: compareResult,
    create_time: Date.now(),
  });

  res.send({
    data: {
      similarity: articlesGraph.serialize(),
      matchResult: matchedArticles,
    },
  });
};

const getArticles = async (req, res) => {
  const esSearchQuery = {
    must_not: [],
    should: [],
  };
  const pageSize = 10;
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

  const searchResult = await searchArticle(page, pageSize, esSearchQuery);

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
  // res.send('ok');
};

const analyzeArticle = async (req, res) => {
  const { title, author, content } = req.body.data;
  const article = new Article(title, author, content);
  article.extractTag().splitSentence().tokenizer();
  article.filtered = stopWord.filterStopWords(article.tokens);
  article.synonym = synonym.findSynonym(article.filtered);

  const responseSize = 10;

  const searchResponse = await searchArticlesByTag(responseSize, article.tags);
  const insertResult = await insertArticles([
    {
      index: {
        _index: process.env.DB_ARTICLE_INDEX,
      },
    },
    {
      title: article.title,
      author: article.author,
      content: article.content,
      processed_content: article.synonym,
      tag: article.tag,
      user_id: req.user.user_id,
      create_time: Date.now(),
    },
  ]);

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
    let result;

    if (articleSimilarity >= 0.1) {
      articleSimilarities.push(articleSimilarity);

      similarArticles.push({
        title: searchResponse.hits.hits[i]._source.title,
        author: searchResponse.hits.hits[i]._source.author,
        content: searchResponse.hits.hits[i]._source.content,
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
  const compareResults = await getCompareResult(req.user.user_id);
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
    element.target_article = articleResult[element.match_result.target_id];
    return element;
  });

  res.status(200).send({ data: highestSimilaityResult });
};

module.exports = {
  comparison,
  multipleComparison,
  getArticles,
  analyzeArticle,
  getArticleDetails,
  getArticleRecords,
};
