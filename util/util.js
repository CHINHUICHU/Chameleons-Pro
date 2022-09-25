/* eslint-disable no-underscore-dangle */
require('dotenv').config();
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const _ = require('lodash');
const { getUserProfile } = require('../server/models/user');

const readFileAsync = promisify(fs.readFile);

const authentication = async (req, res, next) => {
  let accessToken = req.headers.authorization;
  accessToken = accessToken.replace('Bearer ', '');
  if (accessToken === 'null') {
    return res.status(401).send({
      status_code: 401,
      message: 'Unauthorized',
    });
  }
  try {
    const user = await promisify(jwt.verify)(
      accessToken,
      process.env.SECRET_TOKEN
    );
    const result = await getUserProfile(user);
    req.user = {
      user_id: result.data.hits.hits[0]._id,
      name: result.data.hits.hits[0]._source.name,
      email: user.email,
    };
    return next();
  } catch (error) {
    console.log(error);
    return res.status(403).send({
      status_code: 403,
      message: 'Wrong token',
    });
  }
};

const wrapAsync = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};

async function buildStopWordsMap() {
  const stopwordMap = new Map();
  const stopWords = (await readFileAsync('./stops.utf8'))
    .toString()
    .split('\n');
  for (const word of stopWords) {
    stopwordMap.set(word, -1);
  }
  stopwordMap.set(' ', -1);
  stopwordMap.set('\n', -1);
  return stopwordMap;
}

let stopWordMap = new Map();
let synonymMap = new Map();

async function buildSynonymMap() {
  // build synonym map
  // const synonymMap = new Map();
  const synonyms = (await readFileAsync('./dict_synonym.txt'))
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

async function main() {
  stopWordMap = await buildStopWordsMap();
  synonymMap = await buildSynonymMap();
}

main();

async function filterStopWords(splitedParagraphArray) {
  const newArray = _.cloneDeep(splitedParagraphArray);
  const paragraphLength = splitedParagraphArray.length;
  for (let i = 0; i < paragraphLength; i += 1) {
    if (newArray[i].length <= 1 || stopWordMap.get(newArray[i])) {
      newArray[i] = -1;
    }
  }

  const result = newArray.filter((ele) => ele !== -1);

  return result;
}

async function findSynonym(paragraphArray) {
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

function calculateSimilarity(articleA, articleB) {
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

module.exports = {
  authentication,
  wrapAsync,
  stopWordMap,
  synonymMap,
  filterStopWords,
  findSynonym,
  findMatchedKeyword,
  findSimilarSentenseIndex,
  calculateSimilarity,
};
