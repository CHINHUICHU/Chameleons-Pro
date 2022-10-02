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
  if (accessToken === 'null' || !accessToken) {
    return res.status(401).send({
      status_code: 401,
      message: 'Unauthorized',
    });
  }
  accessToken = accessToken.replace('Bearer ', '');
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

function filterStopWords(splitedParagraphArray) {
  const result = [];
  const newArray = _.cloneDeep(splitedParagraphArray);
  for (const sentence of newArray) {
    for (let i = 0; i < sentence.length; i += 1) {
      if (stopWordMap.get(sentence[i])) {
        sentence[i] = -1;
      }
    }
    const sentenceResult = sentence.filter((ele) => ele !== -1);
    result.push(sentenceResult);
  }
  return result;
}

function findSynonym(paragraphArray) {
  const newParagraphArray = _.cloneDeep(paragraphArray);
  for (const sentence of newParagraphArray) {
    for (let i = 0; i < sentence.length; i += 1) {
      if (synonymMap.get(sentence[i])) {
        sentence[i] = synonymMap.get(sentence[i]);
      }
    }
  }
  return newParagraphArray;
}

function findMatchedKeyword(
  articleA,
  articleB,
  articleAtaggedArray,
  articleBtaggedArray
) {
  const result = [];

  for (const source of articleAtaggedArray) {
    for (const target of articleBtaggedArray) {
      const compareSet = [];
      let matched = 0;
      // choose longer sentence to add to the set first
      if (source.length > target.length) {
        source.forEach((element) => compareSet.push(element));
        target.forEach((element) => {
          if (compareSet.includes(element)) {
            matched += 1;
          }
        });
      } else {
        target.forEach((element) => compareSet.push(element));
        source.forEach((element) => {
          if (compareSet.includes(element)) {
            matched += 1;
          }
        });
      }
      if (matched / Math.max(source.length, target.length) >= 0.5) {
        result.push({
          sourceSentence: articleA[articleAtaggedArray.indexOf(source)],
          targetSentence: articleB[articleBtaggedArray.indexOf(target)],
        });
      }
    }
  }

  return result;
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
  filterStopWords,
  findSynonym,
  findMatchedKeyword,
  calculateSimilarity,
};
