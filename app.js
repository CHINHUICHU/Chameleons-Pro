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

app.get(`/api/${process.env.API_VERSION}/comparison`, async (req, res) => {
  const { articleA, articleB } = req.body;
  const articleAsentenseSplit = articleA.split(/(?:，|。|？|：|；|——|！|⋯⋯)+/);
  const articleBsentenseSplit = articleB.split(/(?:，|。|？|：|；|——|！|⋯⋯)+/);

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

  console.log(articleAFiltered);
  console.log('------------------');
  console.log(articleBFiltered);

  const articleAsynonymized = await findSynonym(synonymMap, articleAFiltered);
  const articleBsynonymized = await findSynonym(synonymMap, articleBFiltered);

  const matchedMap = [];
  const articleAsynonymizedLength = articleAsynonymized.length;
  const articleBsynonymizedLength = articleBsynonymized.length;

  console.log(articleAsynonymized);
  console.log('------------------');
  console.log(articleBsynonymized);

  for (let i = 0; i < articleAsynonymizedLength - 2; i += 3) {
    for (let j = 0; j < articleBsynonymizedLength - 2; j += 3) {
      if (
        articleAsynonymized[i] === articleBsynonymized[j] &&
        articleAsynonymized[i + 1] === articleBsynonymized[j + 1] &&
        articleAsynonymized[i + 2] === articleBsynonymized[j + 2]
      ) {
        matchedMap.push({
          articleAIndex: i,
          articleBIndex: j,
        });
      }
    }
  }
  console.log('matched...');
  console.log(matchedMap);

  const articleASet = new Set();
  const articleALength = articleAsentenseSplit.length;
  for (const matchedWord of matchedMap) {
    for (let i = 0; i < articleALength; i += 1) {
      if (
        articleAsentenseSplit[i].includes(
          articleAFiltered[matchedWord.articleAIndex]
        ) &&
        articleAsentenseSplit[i].includes(
          articleAFiltered[matchedWord.articleAIndex + 1]
        ) &&
        articleAsentenseSplit[i].includes(
          articleAFiltered[matchedWord.articleAIndex + 2]
        )
      ) {
        articleASet.add({
          sentense: articleAsentenseSplit[i],
          sentenseIndex: i,
        });
      }
    }
  }

  const articleBSet = new Set();
  const aritcleBLength = articleBsentenseSplit.length;

  for (const matchedWord of matchedMap) {
    for (let i = 0; i < aritcleBLength; i += 1) {
      if (
        articleBsentenseSplit[i].includes(
          articleBFiltered[matchedWord.articleBIndex]
        ) &&
        articleBsentenseSplit[i].includes(
          articleBFiltered[matchedWord.articleBIndex + 1]
        ) &&
        articleBsentenseSplit[i].includes(
          articleBFiltered[matchedWord.articleBIndex + 2]
        )
      ) {
        articleBSet.add({
          sentense: articleBsentenseSplit[i],
          sentenseIndex: i,
        });
      }
    }
  }

  const response = {
    articleA: [],
    articleB: [],
  };
  const articleAsetIterator = articleASet.values();
  const articleBsetIterator = articleBSet.values();

  console.log(articleASet);
  console.log('-----------------');
  console.log(articleBSet);
  for (let i = 0; i < articleASet.size; i += 1) {
    response.articleA.push(articleAsetIterator.next().value);
  }
  for (let i = 0; i < articleBSet.size; i += 1) {
    response.articleB.push(articleBsetIterator.next().value);
  }
  res.send({ data: response });
});

app.listen(process.env.SERVER_PORT, () => {
  console.log(`server is listening on port ${process.env.SERVER_PORT}...`);
});
