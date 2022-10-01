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
  insertTwoArticles,
  insertMultipleArticles,
  searchArticles,
  searchArticlesByTag,
  insertUploadArticle,
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

  for (const sentense of sourceSplit) {
    sourceToken.push(jieba.cut(sentense));
  }

  for (const sentense of targetSplit) {
    targetToken.push(jieba.cut(sentense));
  }

  // const tagNumber = 20;

  // const sourceArticleTag = jieba.extract(sourceArticle.content, tagNumber);
  // const targetArticleTag = jieba.extract(targetArticle.content, tagNumber);

  // const sourceArticleTagKeywords = sourceArticleTag.map(
  //   (element) => element.keyword
  // );
  // const targetArticleTagKeywords = targetArticleTag.map(
  //   (element) => element.keyword
  // );

  try {
    const sourceArticleFiltered = await filterStopWords(sourceToken);
    const targetArticleFiltered = await filterStopWords(targetToken);
    console.log(sourceArticleFiltered);
    console.log('--------------------');
    console.log(targetArticleFiltered);
    console.log('-------------------');
    const sourceArticleSynonymized = await findSynonym(sourceArticleFiltered);
    const targetArticleSynonymized = await findSynonym(targetArticleFiltered);
    // const responseFromES = await insertTwoArticles(
    //   sourceArticle,
    //   targetArticle,
    //   sourceArticleTagKeywords,
    //   sourceArticleFiltered,
    //   sourceArticleSynonymized,
    //   targetArticleTagKeywords,
    //   targetArticleFiltered,
    //   targetArticleSynonymized
    // );

    // console.log('response from elasticSearch!!');
    // console.log(responseFromES);
    // responseFromES.items.forEach((ele) => console.log(ele));
    // console.log(sourceArticlesynonymized);
    // console.log('--------------------');
    // console.log(targetArticlesynonymized);
    // console.log('-------------------');
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
  const articles = req.body.data;

  const tagNumber = 20;

  const articleTags = [];
  articles.forEach((element) => {
    articleTags.push(jieba.extract(element.content, tagNumber));
  });

  console.log(articleTags);
  console.log('---------------');

  const articleKeyowrds = [];

  articleTags.forEach((element) => {
    const newElement = element.map((tag) => tag.keyword);
    console.log(newElement);
    articleKeyowrds.push(newElement);
  });

  console.log(articleKeyowrds);
  console.log('---------------');
  const articleNumber = articles.length;
  console.log(articleNumber);

  const filteredArticles = [];

  const synonymiedArticles = await Promise.all(
    articles.map(async (element) => {
      const tokenizedArticle = jieba.cut(element.content);
      const filteredArticle = await filterStopWords(tokenizedArticle);
      filteredArticles.push(filteredArticle);
      const synonymiedArticle = await findSynonym(filteredArticle);
      return synonymiedArticle;
    })
  );

  const esBulkBody = [];
  for (let i = 0; i < articleNumber; i += 1) {
    esBulkBody.push({
      index: {
        _index: 'test_articles',
      },
    });
    esBulkBody.push({
      title: articles[i].title,
      author: articles[i].author,
      tag: articleKeyowrds[i],
      filtered_content: filteredArticles[i],
      processed_content: synonymiedArticles[i],
      content: articles[i].content,
    });
  }

  const responseFromES = await insertMultipleArticles(esBulkBody);

  console.log('response from elasticSearch!!');
  console.log(responseFromES);
  responseFromES.items.forEach((ele) => console.log(ele));

  const articlesGraph = Graph();
  // const matchedArticles = [];
  const matchedArticles = {};
  for (let i = 0; i < articleNumber; i += 1) {
    for (let j = i + 1; j < articleNumber; j += 1) {
      const similarity = calculateSimilarity(
        synonymiedArticles[i],
        synonymiedArticles[j]
      );
      articlesGraph.addEdge(i + 1, j + 1, similarity);
      const [matchedArticleA, matchedArticleB] = findMatchedKeyword(
        synonymiedArticles[i],
        synonymiedArticles[j],
        filteredArticles[i],
        filteredArticles[j]
      );

      const matchedArticleAindices = findSimilarSentenseIndex(
        articles[i].content,
        matchedArticleA
      );
      const matchedBrticleAindices = findSimilarSentenseIndex(
        articles[j].content,
        matchedArticleB
      );

      matchedArticles[`${i + 1}-and-${j + 1}`] = [
        matchedArticleAindices,
        matchedBrticleAindices,
      ];
    }
  }

  console.dir(matchedArticles);

  console.log(articlesGraph.serialize());

  const response = {
    similarity: articlesGraph.serialize(),
    sentenseIndex: matchedArticles,
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

  // console.log(searchResult.hits.hits);

  // const minHashArray = [];
  // for (let i = 0; i < searchResult.hits.hits.length; i += 1) {
  //   minHashArray[i] = new Minhash();
  //   searchResult.hits.hits[i]._source.processed_content.map((w) => {
  //     minHashArray[i].update(w);
  //   });
  // }

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

const analyzeArticle = async (req, res) => {
  const article = req.body.data;

  console.log(article);
  const articleSplit = jieba.cut(article.content);
  const tagNumber = 20;
  const articleTag = jieba.extract(article.content, tagNumber);
  const articleTagKeywords = articleTag.map((element) => element.keyword);

  console.log(articleTagKeywords);

  const articleFiltered = await filterStopWords(articleSplit);

  const articleSynonymized = await findSynonym(articleFiltered);

  const responseSize = 10;
  const esQuery = [];
  articleTagKeywords.forEach((element) => {
    esQuery.push({ match: { tag: element } });
  });

  console.log('---------es query----------');
  console.log(esQuery);

  const searchResponse = await searchArticlesByTag(responseSize, esQuery);

  console.log(searchResponse);

  console.log(searchResponse.hits.total.value);

  const similarSentenceIndex = [];
  const articleSimilarities = [];
  const similarArticles = [];

  for (
    let i = 0;
    i < Math.min(searchResponse.hits.total.value, responseSize);
    i += 1
  ) {
    const articleSimilarity = calculateSimilarity(
      articleSynonymized,
      searchResponse.hits.hits[i]._source.processed_content
    );
    if (articleSimilarity >= 0.1) {
      articleSimilarities.push(articleSimilarity);
      const [matchedArticleA, matchedArticleB] = findMatchedKeyword(
        articleSynonymized,
        searchResponse.hits.hits[i]._source.processed_content,
        articleFiltered,
        searchResponse.hits.hits[i]._source.filtered_content
      );
      const matchedArticleAindices = findSimilarSentenseIndex(
        article.content,
        matchedArticleA
      );
      const matchedBrticleBindices = findSimilarSentenseIndex(
        searchResponse.hits.hits[i]._source.content,
        matchedArticleB
      );
      similarSentenceIndex.push([
        matchedArticleAindices,
        matchedBrticleBindices,
      ]);
      similarArticles.push(searchResponse.hits.hits[i]._source);
    }
  }

  const maxSimilarity = articleSimilarities.reduce(
    (a, b) => Math.max(a, b),
    -Infinity
  );

  console.log('user_id', req.user.user_id);

  const responseFromES = await insertUploadArticle(
    article,
    articleTagKeywords,
    articleFiltered,
    articleSynonymized,
    req.user.user_id,
    articleSimilarities,
    maxSimilarity
  );

  console.log('response from elasticSearch!!');
  console.log(responseFromES);

  res.send({
    data: {
      similarity: articleSimilarities,
      sentenceIndex: similarSentenceIndex,
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
