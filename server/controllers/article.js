const nodejieba = require('@node-rs/jieba');
const Graph = require('graph-data-structure');

const {
  insertTwoArticles,
  insertMultipleArticles,
  searchArticles,
} = require('../models/article');

const {
  filterStopWords,
  findSynonym,
  findMatchedKeyword,
  findSimilarSentenseIndex,
  calculateSimilarity,
} = require('../../util/util');

const comparison = async (req, res, next) => {
  const { sourceArticle, targetArticle } = req.body.data;

  const sourceArticlesplit = nodejieba.cut(sourceArticle.content);
  const targetArticlesplit = nodejieba.cut(targetArticle.content);

  console.dir(sourceArticlesplit);
  console.log('----------------------');

  const tagNumber = 20;

  const sourceArticletag = nodejieba.extract(sourceArticle.content, tagNumber);
  const targetArticletag = nodejieba.extract(targetArticle.content, tagNumber);

  const sourceArticletagKeywords = sourceArticletag.map(
    (element) => element.keyword
  );
  const targetArticletagKeywords = targetArticletag.map(
    (element) => element.keyword
  );

  console.log(sourceArticletagKeywords);
  console.log('-----------');
  console.log(targetArticletagKeywords);

  try {
    const sourceArticleFiltered = await filterStopWords(sourceArticlesplit);
    const targetArticleFiltered = await filterStopWords(targetArticlesplit);
    console.log(sourceArticleFiltered);
    console.log('--------------------');
    console.log(targetArticleFiltered);
    console.log('-------------------');
    const sourceArticlesynonymized = await findSynonym(sourceArticleFiltered);
    const targetArticlesynonymized = await findSynonym(targetArticleFiltered);
    const responseFromES = await insertTwoArticles(
      sourceArticle,
      targetArticle,
      sourceArticletagKeywords,
      sourceArticleFiltered,
      sourceArticlesynonymized,
      targetArticletagKeywords,
      targetArticleFiltered,
      targetArticlesynonymized
    );

    //   body: [
    //     {
    //       index: {
    //         _index: 'test_articles',
    //       },
    //     },
    //     {
    //       title: sourceArticle.title,
    //       author: sourceArticle.author,
    //       tag: sourceArticletagKeywords,
    //       filtered_content: sourceArticleFiltered,
    //       processed_content: sourceArticlesynonymized,
    //       content: sourceArticle.content,
    //     },
    //     {
    //       index: {
    //         _index: 'test_articles',
    //       },
    //     },
    //     {
    //       title: targetArticle.title,
    //       author: targetArticle.author,
    //       tag: targetArticletagKeywords,
    //       filtered_content: targetArticleFiltered,
    //       processed_content: targetArticlesynonymized,
    //       content: targetArticle.content,
    //     },
    //   ],
    // });
    console.log('response from elasticSearch!!');
    console.log(responseFromES);
    responseFromES.items.forEach((ele) => console.log(ele));
    console.log(sourceArticlesynonymized);
    console.log('--------------------');
    console.log(targetArticlesynonymized);
    console.log('-------------------');
    const articleSimilarity = calculateSimilarity(
      sourceArticlesynonymized,
      targetArticlesynonymized
    );
    const [matchedsourceArticle, matchedtargetArticle] = findMatchedKeyword(
      sourceArticlesynonymized,
      targetArticlesynonymized,
      sourceArticleFiltered,
      targetArticleFiltered
    );
    console.log(matchedsourceArticle);
    console.log('-------------------');
    console.log(matchedtargetArticle);
    console.log('-------------------');
    const matchedsourceArticleindices = findSimilarSentenseIndex(
      sourceArticle.content,
      matchedsourceArticle
    );
    const matchedBrticleAindices = findSimilarSentenseIndex(
      targetArticle.content,
      matchedtargetArticle
    );
    console.log('matched index');
    console.log(matchedsourceArticleindices);
    console.log('--------------------');
    console.log(matchedBrticleAindices);
    const response = {
      similarity: articleSimilarity,
      sourceArticle: matchedsourceArticleindices,
      targetArticle: matchedBrticleAindices,
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
    articleTags.push(nodejieba.extract(element.content, tagNumber));
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
      const tokenizedArticle = nodejieba.cut(element.content);
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
    must: [],
    must_not: [],
    should: [],
  };
  const pageSize = 10;
  const { page } = req.query;
  const searchConditions = req.query.key.split(' ');
  console.log(searchConditions);

  if (searchConditions.length > 0) {
    searchConditions.forEach((element) => {
      if (element[0] === '+') {
        esSearchQuery.must.push({
          multi_match: { query: element.substring(1) },
        });
      } else if (element[0] === '-') {
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

module.exports = { comparison, multipleComparison, getArticles };
