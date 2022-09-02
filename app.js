require('dotenv').config();
const express = require('express');
const nodejieba = require('nodejieba');

nodejieba.load({ userDict: './dict.utf8' });
const bodyParser = require('body-parser');
const fs = require('fs');
const { promisify } = require('util');

const readAsync = promisify(fs.readFile);
const app = express();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const _ = require('lodash');

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
          articleAmchtedKeyword.push(
            articleAarray[compareSubarray.get(element)]
          );
          articleBmchtedKeyword.push(
            articleBarray[articleBsubarray.indexOf(element) + j]
          );
          compareSubarray.delete(element);
        }
      });

      if (articleAmchtedKeyword.length >= 3) {
        matchedArticleA.push(articleAmchtedKeyword);
        matchedArticleB.push(articleBmchtedKeyword);
      }
    }
  }

  return [matchedArticleA, matchedArticleB];
}

function findKeywordIndex(article, matchedKeywords) {
  const indexArray = [];
  matchedKeywords.forEach((element) => {
    const indices = [];
    element.forEach((word) => {
      indices.push(article.indexOf(word));
    });
    indexArray.push(indices);
  });
  return indexArray;
}

app.get(`/api/${process.env.API_VERSION}/comparison`, async (req, res) => {
  const { articleA, articleB } = req.body;
  //   const articleAsentenseSplit = articleA.split(/(?:，|。|？|：|；|——|！|⋯⋯)+/);
  //   const articleBsentenseSplit = articleB.split(/(?:，|。|？|：|；|——|！|⋯⋯)+/);

  const articleAsplit = nodejieba.cut(articleA);
  const articleBsplit = nodejieba.cut(articleB);

  // search stop words in file
  const stopwordMap = new Map();
  const stopWords = (await readAsync('./stops.utf8')).toString().split('\n');
  for (const word of stopWords) {
    stopwordMap.set(word, -1);
  }
  stopwordMap.set(' ', -1);
  stopwordMap.set('\n', -1);

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

  const articleAFiltered = await filterStopWords(stopwordMap, articleAsplit);
  const articleBFiltered = await filterStopWords(stopwordMap, articleBsplit);

  //   console.log(articleAFiltered);
  //   console.log('------------------');
  //   console.log(articleBFiltered);

  const articleAsynonymized = await findSynonym(synonymMap, articleAFiltered);
  const articleBsynonymized = await findSynonym(synonymMap, articleBFiltered);

  //   const matchedMap = [];

  const [matchedArticleA, matchedArticleB] = findMatchedKeyword(
    articleAsynonymized,
    articleBsynonymized,
    articleAFiltered,
    articleBFiltered
  );
  const matchedArticleAindices = findKeywordIndex(articleA, matchedArticleA);
  const matchedBrticleAindices = findKeywordIndex(articleB, matchedArticleB);

  console.log('heyyyyy');
  console.log(matchedArticleA);
  console.log('---------------------');
  console.log(matchedArticleB);

  const response = {
    articleA: matchedArticleAindices,
    articleB: matchedBrticleAindices,
  };

  res.send({ data: response });
});

app.listen(process.env.SERVER_PORT, () => {
  console.log(`server is listening on port ${process.env.SERVER_PORT}...`);
});
