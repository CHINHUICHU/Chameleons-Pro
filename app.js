/* eslint-disable no-console */
require('dotenv').config();
const express = require('express');
const nodejieba = require('@node-rs/jieba');

const _ = require('lodash');
const fs = require('fs');
const { promisify } = require('util');
const cors = require('cors');
const bodyParser = require('body-parser');
const Graph = require('graph-data-structure');

nodejieba.load({ userDict: './dict.utf8' });

const readAsync = promisify(fs.readFile);
const app = express();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors());

async function buildStopWordsMap() {
  // search stop words in file
  const stopwordMap = new Map();
  const stopWords = (await readAsync('./stops.utf8')).toString().split('\n');
  for (const word of stopWords) {
    stopwordMap.set(word, -1);
  }
  stopwordMap.set(' ', -1);
  stopwordMap.set('\n', -1);
  return stopwordMap;
}

async function buildSynonymMap() {
  // build synonym map
  const synonymMap = new Map();
  const synonyms = (await readAsync('./dict_synonym.txt'))
    .toString()
    .split('\n');
  for (const sysnonym of synonyms) {
    const words = sysnonym.split(' ');
    for (let i = 1; i < words.length; i += 1) {
      synonymMap.set(words[i], words[0]);
    }
  }
  return synonymMap;
}

async function filterStopWords(stopwordMap, splitedParagraphArray) {
  const newArray = _.cloneDeep(splitedParagraphArray);
  const paragraphLength = splitedParagraphArray.length;
  for (let i = 0; i < paragraphLength; i += 1) {
    if (newArray[i].length <= 1 || stopwordMap.get(newArray[i])) {
      newArray[i] = -1;
    }
  }

  const result = newArray.filter((ele) => ele !== -1);

  return result;
}

async function findSynonym(synonymMap, paragraphArray) {
  const newParagraphArray = _.cloneDeep(paragraphArray);
  const paragraphLength = newParagraphArray.length;
  for (let i = 0; i < paragraphLength; i += 1) {
    if (synonymMap.get(newParagraphArray[i])) {
      newParagraphArray[i] = synonymMap.get(newParagraphArray[i]);
    }
  }
  return newParagraphArray;
}

function findMatchedKeyword(
  articleAtaggedArray,
  articleBtaggedArray,
  articleAarray,
  articleBarray
) {
  const matchedArticleA = [];
  const matchedArticleB = [];
  const articleAlength = articleAtaggedArray.length;
  const articleBlength = articleBtaggedArray.length;
  const articleAarrayForSearch = [...articleAarray];
  const articleBarrayForSearch = [...articleBarray];

  for (let i = 0; i < articleAlength; i += 7) {
    for (let j = 0; j < articleBlength; j += 7) {
      const articleAsubarray = articleAtaggedArray.slice(
        i,
        Math.min(i + 7, articleAlength)
      );
      const articleBsubarray = articleBtaggedArray.slice(
        j,
        Math.min(j + 7, articleBlength)
      );

      const compareSubarray = new Map();
      const articleAmchtedKeyword = [];
      const articleBmchtedKeyword = [];

      articleAsubarray.forEach((element) => {
        compareSubarray.set(element, articleAsubarray.indexOf(element) + i);
      });

      articleBsubarray.forEach((element) => {
        if (compareSubarray.get(element)) {
          articleAmchtedKeyword.push({
            keyword: articleAarray[compareSubarray.get(element)],
            index: compareSubarray.get(element),
          });
          articleBmchtedKeyword.push({
            keyword: articleBarray[articleBsubarray.indexOf(element) + j],
            index: articleBsubarray.indexOf(element) + j,
          });
          compareSubarray.delete(element);
        }
      });

      if (articleAmchtedKeyword.length >= 3) {
        matchedArticleA.push(articleAmchtedKeyword);
        matchedArticleB.push(articleBmchtedKeyword);
      }
    }
  }

  console.log(articleAarrayForSearch);
  console.log('----------------------');
  console.log(articleBarrayForSearch);

  return [matchedArticleA, matchedArticleB];
}

function findSimilarSentenseIndex(article, matchedKeywords) {
  let articleForSearching = article;

  matchedKeywords.forEach((element) => {
    element.forEach((matched) => {
      const matchedLength = matched.keyword.length;

      if (matchedLength === 2) {
        articleForSearching = articleForSearching.replace(
          matched.keyword,
          'ＯＯ'
        );
      }

      if (matchedLength === 3) {
        articleForSearching = articleForSearching.replace(
          matched.keyword,
          'ＯＯＯ'
        );
      }
      if (matchedLength === 4) {
        articleForSearching = articleForSearching.replace(
          matched.keyword,
          'ＯＯＯＯ'
        );
      }
    });
  });

  const splitArticle = articleForSearching.split(/(?:，|。|\n|！|？|：|；)+/);

  console.log(splitArticle.length, splitArticle);

  const markingArray = [];

  splitArticle.forEach((sentense) => {
    if (sentense.includes('ＯＯ')) {
      markingArray.push(1);
    } else markingArray.push(0);
  });

  return markingArray;
}

function calculateSimilary(articleA, articleB) {
  const articleAset = new Set();
  articleA.forEach((element) => {
    articleAset.add(element);
  });

  const articleBset = new Set();
  articleB.forEach((element) => {
    articleBset.add(element);
  });

  const intersection = new Set(
    [...articleAset].filter((element) => articleBset.has(element))
  );

  const union = new Set([...articleAset, ...articleBset]);
  const similarity = intersection.size / union.size;

  return similarity;
}

app.post(
  `/api/${process.env.API_VERSION}/comparison`,
  async (req, res, next) => {
    const { articleA, articleB } = req.body;

    const articleAsplit = nodejieba.cut(articleA);
    const articleBsplit = nodejieba.cut(articleB);

    try {
      const stopwordMap = await buildStopWordsMap();
      const synonymMap = await buildSynonymMap();

      const articleAFiltered = await filterStopWords(
        stopwordMap,
        articleAsplit
      );
      const articleBFiltered = await filterStopWords(
        stopwordMap,
        articleBsplit
      );

      console.log(articleAFiltered);
      console.log('--------------------');
      console.log(articleBFiltered);
      console.log('-------------------');

      const articleAsynonymized = await findSynonym(
        synonymMap,
        articleAFiltered
      );
      const articleBsynonymized = await findSynonym(
        synonymMap,
        articleBFiltered
      );

      console.log(articleAsynonymized);
      console.log('--------------------');
      console.log(articleBsynonymized);
      console.log('-------------------');

      const articleSimilarity = calculateSimilary(
        articleAsynonymized,
        articleBsynonymized
      );

      const [matchedArticleA, matchedArticleB] = findMatchedKeyword(
        articleAsynonymized,
        articleBsynonymized,
        articleAFiltered,
        articleBFiltered
      );

      console.log(matchedArticleA);
      console.log('-------------------');
      console.log(matchedArticleB);
      console.log('-------------------');

      const matchedArticleAindices = findSimilarSentenseIndex(
        articleA,
        matchedArticleA
      );
      const matchedBrticleAindices = findSimilarSentenseIndex(
        articleB,
        matchedArticleB
      );

      console.log('matched index');
      console.log(matchedArticleAindices);
      console.log('--------------------');
      console.log(matchedBrticleAindices);

      const response = {
        similarity: articleSimilarity,
        articleA: matchedArticleAindices,
        articleB: matchedBrticleAindices,
      };

      res.send({ data: response });
    } catch (err) {
      console.log(err);
      next();
    }
  }
);

app.post(
  `/api/${process.env.API_VERSION}/multiple/comparison`,
  async (req, res) => {
    const data = req.body['articles[]'];
    console.log(data);

    const articleNumber = data.length;
    console.log(articleNumber);

    const stopwordMap = await buildStopWordsMap();
    const synonymMap = await buildSynonymMap();

    const processedData = await Promise.all(
      data.map(async (element) => {
        const tokenizedArticle = nodejieba.cut(element);
        const filteredArticle = await filterStopWords(
          stopwordMap,
          tokenizedArticle
        );
        const synonymiedArticle = await findSynonym(
          synonymMap,
          filteredArticle
        );
        return synonymiedArticle;
      })
    );

    const articlesGraph = Graph();

    for (let i = 0; i < articleNumber; i += 1) {
      for (let j = i + 1; j < articleNumber; j += 1) {
        let similarity = calculateSimilary(processedData[i], processedData[j]);
        articlesGraph.addEdge(i, j, -Math.log(similarity));
      }
    }

    console.log(articlesGraph.serialize());

    res.send({ data: articlesGraph.serialize() });
  }
);

app.get(`/api/${process.env.API_VERSION}/health`, (req, res) => {
  res.send('I am healthy server!!!!');
});

// 404 error handling
// eslint-disable-next-line no-unused-vars
app.use((req, res, next) => {
  res
    .status(404)
    .json({ error_code: 404, error_message: 'please give correct route' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.log('something wrong', err);
  res
    .status(500)
    .send({ error_code: 500, error_message: 'internal server error' });
});

app.listen(process.env.SERVER_PORT, () => {
  console.log(`server is listening on port ${process.env.SERVER_PORT}...`);
});
