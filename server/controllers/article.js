/* eslint-disable no-underscore-dangle */
require('dotenv').config();

const createJieba = require('js-jieba');
const {
  JiebaDict,
  HMMModel,
  UserDict,
  IDF,
  StopWords,
} = require('jieba-zh-tw');

const jieba = createJieba(JiebaDict, HMMModel, UserDict, IDF, StopWords);

const Graph = require('graph-data-structure');

const {
  insertArticles,
  insertCompareResult,
  searchArticles,
  searchArticlesByTag,
  searchArticleById,
  getRecords,
} = require('../models/article');

const {
  filterStopWords,
  findSynonym,
  findMatchedKeyword,
  calculateSimilarity,
} = require('../../util/util');

const comparison = async (req, res, next) => {
  const { sourceArticle, targetArticle } = req.body.data;

  const sourceSplit = sourceArticle.content.split(/(?:，|。|\n|！|？|：|；)+/);
  const targetSplit = targetArticle.content.split(/(?:，|。|\n|！|？|：|；)+/);

  const sourceToken = [];
  const targetToken = [];

  for (const sentence of sourceSplit) {
    sourceToken.push(jieba.cut(sentence));
  }

  for (const sentence of targetSplit) {
    targetToken.push(jieba.cut(sentence));
  }

  const tagNumber = 20;

  const sourceArticleTag = jieba.extract(sourceArticle.content, tagNumber);
  const targetArticleTag = jieba.extract(targetArticle.content, tagNumber);

  const sourceArticleTagKeywords = sourceArticleTag.map(
    (element) => element.word
  );
  const targetArticleTagKeywords = targetArticleTag.map(
    (element) => element.word
  );

  try {
    const sourceArticleFiltered = filterStopWords(sourceToken);
    const targetArticleFiltered = filterStopWords(targetToken);

    const sourceArticleSynonymized = findSynonym(sourceArticleFiltered);
    const targetArticleSynonymized = findSynonym(targetArticleFiltered);

    const insertArtile = [
      {
        index: {
          _index: process.env.DB_ARTICLE_INDEX,
        },
      },
      {
        title: sourceArticle.title,
        author: sourceArticle.author,
        content: sourceArticle.content,
        processed_content: sourceArticleSynonymized,
        tag: sourceArticleTagKeywords,
        user_id: req.user.user_id,
        create_time: Date.now(),
      },
      {
        index: {
          _index: process.env.DB_ARTICLE_INDEX,
        },
      },
      {
        title: targetArticle.title,
        author: targetArticle.author,
        content: targetArticle.content,
        processed_content: targetArticleSynonymized,
        tag: targetArticleTagKeywords,
        user_id: req.user.user_id,
        create_time: Date.now(),
      },
    ];

    const insertArticlesResult = await insertArticles(insertArtile);

    console.log(insertArticlesResult.items);

    const articleSimilarity = calculateSimilarity(
      sourceArticleSynonymized.flat(),
      targetArticleSynonymized.flat()
    );

    const result = findMatchedKeyword(
      sourceSplit,
      targetSplit,
      sourceArticleSynonymized,
      targetArticleSynonymized
    );

    const compareResult = [
      {
        index: {
          _index: process.env.DB_COMPARE_INDEX,
        },
      },
      {
        compare_mode: 1,
        similarity: articleSimilarity,
        source_id: insertArticlesResult.items[0].index._id,
        target_id: insertArticlesResult.items[1].index._id,
        match_result: result,
      },
    ];

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
  let articles = req.body.data;

  const tagNumber = 20;

  articles = articles.map((element) => {
    const newElement = element;
    const tags = jieba.extract(element.content, tagNumber);
    const keywords = tags.map((tag) => tag.word);
    newElement.tag = keywords;
    return newElement;
  });

  const splitArticles = [];
  const filteredArticles = [];
  const synonymizedArticles = [];
  const insertedArticles = [];

  for (const article of articles) {
    const splitArticle = article.content.split(/(?:，|。|\n|！|？|：|；)+/);

    splitArticles.push(splitArticle);

    const tokenizedArticle = splitArticle.map((sentence) =>
      jieba.cut(sentence)
    );

    const filteredArticle = filterStopWords(tokenizedArticle);
    filteredArticles.push(filteredArticle);

    const synonymizedArticle = findSynonym(filteredArticle);
    synonymizedArticles.push(synonymizedArticle);

    insertedArticles.push({
      index: {
        _index: process.env.DB_ARTICLE_INDEX,
      },
    });

    insertedArticles.push({
      title: article.title,
      author: article.author,
      content: article.content,
      processed_content: synonymizedArticle,
      tag: article.tag,
      user_id: req.user.user_id,
      create_time: Date.now(),
    });
  }

  const insertArticlesResult = await insertArticles(insertedArticles);

  const articlesGraph = Graph();
  const matchedArticles = {};

  const articleNumber = articles.length;
  const compareResult = [];

  for (let i = 0; i < articleNumber; i += 1) {
    for (let j = i + 1; j < articleNumber; j += 1) {
      const similarity = calculateSimilarity(
        synonymizedArticles[i].flat(),
        synonymizedArticles[j].flat()
      );
      articlesGraph.addEdge(i + 1, j + 1, similarity);
      const matchResult = findMatchedKeyword(
        splitArticles[i],
        splitArticles[j],
        synonymizedArticles[i],
        synonymizedArticles[j]
      );

      matchedArticles[`${i + 1}-and-${j + 1}`] = matchResult;

      compareResult.push({
        index: {
          _index: process.env.DB_COMPARE_INDEX,
        },
      });

      compareResult.push({
        compare_mode: 2,
        similarity,
        source_id: insertArticlesResult.items[i].index._id,
        target_id: insertArticlesResult.items[j].index._id,
        match_result: matchResult,
      });
    }
  }

  // console.log('compare result', compareResult);

  await insertCompareResult(compareResult);

  const response = {
    similarity: articlesGraph.serialize(),
    matchResult: matchedArticles,
  };

  res.send({ data: response });
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

  const searchResult = await searchArticles(page, pageSize, esSearchQuery);

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
  const article = req.body.data;

  const tokenizedArticle = [];
  const articleSplit = article.content.split(/(?:，|。|\n|！|？|：|；)+/);

  for (const sentence of articleSplit) {
    tokenizedArticle.push(jieba.cut(sentence));
  }

  const tagNumber = 20;
  const articleTag = jieba.extract(article.content, tagNumber);
  const articleTagKeywords = articleTag.map((element) => element.word);
  article.tag = articleTagKeywords;

  const articleFiltered = filterStopWords(tokenizedArticle);

  const articleSynonymized = findSynonym(articleFiltered);

  const responseSize = 10;
  const searchTags = [];
  articleTagKeywords.forEach((element) => {
    searchTags.push({ match: { tag: element } });
  });

  const searchResponse = await searchArticlesByTag(responseSize, searchTags);
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
      processed_content: articleSynonymized,
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
      articleSynonymized.flat(),
      searchResponse.hits.hits[i]._source.processed_content.flat()
    );

    if (articleSimilarity >= 0.1) {
      articleSimilarities.push(articleSimilarity);

      const result = findMatchedKeyword(
        articleSplit,
        searchResponse.hits.hits[i]._source.content.split(
          /(?:，|。|\n|！|？|：|；)+/
        ),
        articleSynonymized,
        searchResponse.hits.hits[i]._source.processed_content
      );

      similarArticles.push({
        title: searchResponse.hits.hits[i]._source.title,
        author: searchResponse.hits.hits[i]._source.author,
        content: searchResponse.hits.hits[i]._source.content,
      });

      matchResult.push(result);
    }

    compareResult.push({
      index: {
        _index: process.env.DB_COMPARE_INDEX,
      },
    });

    compareResult.push({
      compare_mode: 3,
      similarity: articleSimilarity,
      source_id: insertResult.items[0].index._id,
      target_id: searchResponse.hits.hits[i]._id,
      match_result: matchResult,
    });
  }

  console.log('compare result', compareResult);

  await insertCompareResult(compareResult);

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

const getArticleRecords = async (req, res) => {
  console.log(req.user.user_id);
  const result = await getRecords(req.user.user_id);
  console.log('result', result);
  const response = [];
  for (const article of result.hits.hits) {
    response.push({
      title: article._source.title,
      author: article._source.author,
      similar_articles: article._source.similar_articles,
      highest_similarity: article._source.highest_similarity,
    });
  }
  res.status(200).send({ data: response });
};

module.exports = {
  comparison,
  multipleComparison,
  getArticles,
  analyzeArticle,
  getArticleDetails,
  getArticleRecords,
};
