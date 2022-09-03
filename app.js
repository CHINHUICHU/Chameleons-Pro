require('dotenv').config();
const express = require('express');
const nodejieba = require('nodejieba');
const _ = require('lodash');
const fs = require('fs');
const { promisify } = require('util');
const cors = require('cors');
const bodyParser = require('body-parser');

nodejieba.load({ userDict: './dict.utf8' });

const readAsync = promisify(fs.readFile);
const app = express();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

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
      // search stop words in file
      const stopwordMap = new Map();
      const stopWords = (await readAsync('./stops.utf8'))
        .toString()
        .split('\n');
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

      const articleAFiltered = await filterStopWords(
        stopwordMap,
        articleAsplit
      );
      const articleBFiltered = await filterStopWords(
        stopwordMap,
        articleBsplit
      );

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
      const matchedArticleAindices = findKeywordIndex(
        articleA,
        matchedArticleA
      );
      const matchedBrticleAindices = findKeywordIndex(
        articleB,
        matchedArticleB
      );

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

// 404 error handling
app.use((req, res, next) =>
  res
    .status(404)
    .json({ error_code: 404, error_message: 'please give correct route' })
);

app.use((err, req, res, next) => {
  console.log('something wrong', err);
  res.status(500).send({ error_code: 500, error_message: 'server error' });
});

app.listen(process.env.SERVER_PORT, () => {
  console.log(`server is listening on port ${process.env.SERVER_PORT}...`);
});
