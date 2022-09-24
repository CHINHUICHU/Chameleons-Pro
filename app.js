/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
require('dotenv').config();
const express = require('express');
const nodejieba = require('@node-rs/jieba');
// const _ = require('lodash');

const cors = require('cors');
// const Graph = require('graph-data-structure');

const path = require('path');
// const { stopWordMap, synonymMap } = require('./util/util');

const options = {
  root: path.join(__dirname, 'public'),
};

const { client } = require('./server/models/database');

nodejieba.load({ userDict: './dict.utf8' });

const app = express();
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '50mb' }));
// app.use(express.json());
app.set('view engine', 'ejs');
app.use(cors());

app.use(`/api/${process.env.API_VERSION}`, [
  require('./server/routes/user'),
  require('./server/routes/article'),
]);

// async function filterStopWords(splitedParagraphArray) {
//   const newArray = _.cloneDeep(splitedParagraphArray);
//   const paragraphLength = splitedParagraphArray.length;
//   for (let i = 0; i < paragraphLength; i += 1) {
//     if (newArray[i].length <= 1 || stopWordMap.get(newArray[i])) {
//       newArray[i] = -1;
//     }
//   }

//   const result = newArray.filter((ele) => ele !== -1);

//   return result;
// }

// async function findSynonym(paragraphArray) {
//   const newParagraphArray = _.cloneDeep(paragraphArray);
//   const paragraphLength = newParagraphArray.length;
//   for (let i = 0; i < paragraphLength; i += 1) {
//     if (synonymMap.get(newParagraphArray[i])) {
//       newParagraphArray[i] = synonymMap.get(newParagraphArray[i]);
//     }
//   }
//   return newParagraphArray;
// }

// function findMatchedKeyword(
//   articleAtaggedArray,
//   articleBtaggedArray,
//   articleAarray,
//   articleBarray
// ) {
//   const matchedArticleA = [];
//   const matchedArticleB = [];
//   const articleAlength = articleAtaggedArray.length;
//   const articleBlength = articleBtaggedArray.length;
//   const articleAarrayForSearch = [...articleAarray];
//   const articleBarrayForSearch = [...articleBarray];

//   for (let i = 0; i < articleAlength; i += 7) {
//     for (let j = 0; j < articleBlength; j += 7) {
//       const articleAsubarray = articleAtaggedArray.slice(
//         i,
//         Math.min(i + 7, articleAlength)
//       );
//       const articleBsubarray = articleBtaggedArray.slice(
//         j,
//         Math.min(j + 7, articleBlength)
//       );

//       const compareSubarray = new Map();
//       const articleAmchtedKeyword = [];
//       const articleBmchtedKeyword = [];

//       articleAsubarray.forEach((element) => {
//         compareSubarray.set(element, articleAsubarray.indexOf(element) + i);
//       });

//       articleBsubarray.forEach((element) => {
//         if (compareSubarray.get(element)) {
//           articleAmchtedKeyword.push({
//             keyword: articleAarray[compareSubarray.get(element)],
//             index: compareSubarray.get(element),
//           });
//           articleBmchtedKeyword.push({
//             keyword: articleBarray[articleBsubarray.indexOf(element) + j],
//             index: articleBsubarray.indexOf(element) + j,
//           });
//           compareSubarray.delete(element);
//         }
//       });

//       if (articleAmchtedKeyword.length >= 3) {
//         matchedArticleA.push(articleAmchtedKeyword);
//         matchedArticleB.push(articleBmchtedKeyword);
//       }
//     }
//   }

//   console.log(articleAarrayForSearch);
//   console.log('----------------------');
//   console.log(articleBarrayForSearch);

//   return [matchedArticleA, matchedArticleB];
// }

// function findSimilarSentenseIndex(article, matchedKeywords) {
//   let articleForSearching = article;

//   matchedKeywords.forEach((element) => {
//     element.forEach((matched) => {
//       const matchedLength = matched.keyword.length;

//       if (matchedLength === 2) {
//         articleForSearching = articleForSearching.replace(
//           matched.keyword,
//           'ＯＯ'
//         );
//       }

//       if (matchedLength === 3) {
//         articleForSearching = articleForSearching.replace(
//           matched.keyword,
//           'ＯＯＯ'
//         );
//       }
//       if (matchedLength === 4) {
//         articleForSearching = articleForSearching.replace(
//           matched.keyword,
//           'ＯＯＯＯ'
//         );
//       }
//     });
//   });

//   const splitArticle = articleForSearching.split(/(?:，|。|\n|！|？|：|；)+/);

//   console.log(splitArticle.length, splitArticle);

//   const markingArray = [];

//   splitArticle.forEach((sentense) => {
//     if (sentense.includes('ＯＯ')) {
//       markingArray.push(1);
//     } else markingArray.push(0);
//   });

//   return markingArray;
// }

// function calculateSimilarity(articleA, articleB) {
//   const articleAset = new Set();
//   articleA.forEach((element) => {
//     articleAset.add(element);
//   });

//   const articleBset = new Set();
//   articleB.forEach((element) => {
//     articleBset.add(element);
//   });

//   const intersection = new Set(
//     [...articleAset].filter((element) => articleBset.has(element))
//   );

//   const union = new Set([...articleAset, ...articleBset]);
//   const similarity = intersection.size / union.size;

//   return similarity;
// }

app.get('/', (req, res, next) => {
  const fileName = 'index.html';
  res.sendFile(fileName, options, (err) => {
    if (err) {
      next(err);
    } else {
      console.log('Sent:', fileName);
    }
  });
});

app.get('/multiple', (req, res, next) => {
  const fileName = 'multiple.html';
  res.sendFile(fileName, options, (err) => {
    if (err) {
      next(err);
    } else {
      console.log('Sent:', fileName);
    }
  });
});

app.get('/upload', (req, res, next) => {
  const fileName = 'upload.html';
  res.sendFile(fileName, options, (err) => {
    if (err) {
      next(err);
    } else {
      console.log('Sent:', fileName);
    }
  });
});

app.get('/user', (req, res, next) => {
  const fileName = 'user.html';
  res.sendFile(fileName, options, (err) => {
    if (err) {
      next(err);
    } else {
      console.log('Sent:', fileName);
    }
  });
});

app.get('/search', (req, res, next) => {
  const fileName = 'search.html';
  res.sendFile(fileName, options, (err) => {
    if (err) {
      next(err);
    } else {
      console.log('Sent:', fileName);
    }
  });
});

app.get('/article', (req, res, next) => {
  const fileName = 'article.html';
  res.sendFile(fileName, options, (err) => {
    if (err) {
      next(err);
    } else {
      console.log('Sent:', fileName);
    }
  });
});

app.get('/single', (req, res, next) => {
  const fileName = 'single.html';
  res.sendFile(fileName, options, (err) => {
    if (err) {
      next(err);
    } else {
      console.log('Sent:', fileName);
    }
  });
});

app.get('/login', (req, res, next) => {
  const fileName = 'login.html';
  res.sendFile(fileName, options, (err) => {
    if (err) {
      next(err);
    } else {
      console.log('Sent:', fileName);
    }
  });
});

// app.post(
//   `/api/${process.env.API_VERSION}/comparison`
//   // async (req, res, next) => {
//   //   // console.log(req.body);
//   //   const { articleA, articleB } = req.body.data;

//   //   const articleAsplit = nodejieba.cut(articleA.content);
//   //   const articleBsplit = nodejieba.cut(articleB.content);

//   //   console.dir(articleAsplit);
//   //   console.log('----------------------');

//   //   const tagNumber = 20;

//   //   const articleAtag = nodejieba.extract(articleA.content, tagNumber);
//   //   const articleBtag = nodejieba.extract(articleB.content, tagNumber);

//   //   const articleAtagKeywords = articleAtag.map((element) => element.keyword);
//   //   const articleBtagKeywords = articleBtag.map((element) => element.keyword);

//   //   console.log(articleAtagKeywords);
//   //   console.log('-----------');
//   //   console.log(articleBtagKeywords);

//   //   try {
//   //     console.log(stopWordMap);
//   //     const articleAFiltered = await filterStopWords(articleAsplit);
//   //     const articleBFiltered = await filterStopWords(articleBsplit);
//   //     console.log(articleAFiltered);
//   //     console.log('--------------------');
//   //     console.log(articleBFiltered);
//   //     console.log('-------------------');
//   //     const articleAsynonymized = await findSynonym(articleAFiltered);
//   //     const articleBsynonymized = await findSynonym(articleBFiltered);
//   //     const responseFromES = await client.bulk({
//   //       body: [
//   //         {
//   //           index: {
//   //             _index: 'test_articles',
//   //           },
//   //         },
//   //         {
//   //           title: articleA.title,
//   //           author: articleA.author,
//   //           tag: articleAtagKeywords,
//   //           filtered_content: articleAFiltered,
//   //           processed_content: articleAsynonymized,
//   //           content: articleA.content,
//   //         },
//   //         {
//   //           index: {
//   //             _index: 'test_articles',
//   //           },
//   //         },
//   //         {
//   //           title: articleB.title,
//   //           author: articleB.author,
//   //           tag: articleBtagKeywords,
//   //           filtered_content: articleBFiltered,
//   //           processed_content: articleBsynonymized,
//   //           content: articleB.content,
//   //         },
//   //       ],
//   //     });
//   //     console.log('response from elasticSearch!!');
//   //     console.log(responseFromES);
//   //     responseFromES.items.forEach((ele) => console.log(ele));
//   //     console.log(articleAsynonymized);
//   //     console.log('--------------------');
//   //     console.log(articleBsynonymized);
//   //     console.log('-------------------');
//   //     const articleSimilarity = calculateSimilarity(
//   //       articleAsynonymized,
//   //       articleBsynonymized
//   //     );
//   //     const [matchedArticleA, matchedArticleB] = findMatchedKeyword(
//   //       articleAsynonymized,
//   //       articleBsynonymized,
//   //       articleAFiltered,
//   //       articleBFiltered
//   //     );
//   //     console.log(matchedArticleA);
//   //     console.log('-------------------');
//   //     console.log(matchedArticleB);
//   //     console.log('-------------------');
//   //     const matchedArticleAindices = findSimilarSentenseIndex(
//   //       articleA.content,
//   //       matchedArticleA
//   //     );
//   //     const matchedBrticleAindices = findSimilarSentenseIndex(
//   //       articleB.content,
//   //       matchedArticleB
//   //     );
//   //     console.log('matched index');
//   //     console.log(matchedArticleAindices);
//   //     console.log('--------------------');
//   //     console.log(matchedBrticleAindices);
//   //     const response = {
//   //       similarity: articleSimilarity,
//   //       articleA: matchedArticleAindices,
//   //       articleB: matchedBrticleAindices,
//   //     };
//   //     res.send({ data: response });
//   //   } catch (err) {
//   //     console.log(err);
//   //     next();
//   //   }
//   // }
// );

// app.post(
//   `/api/${process.env.API_VERSION}/multiple/comparison`,
//   async (req, res) => {
//     console.log(req.body.data);
//     const articles = req.body.data;
//     console.log(articles);

//     // const stopwordMap = await buildStopWordsMap();
//     // const synonymMap = await buildSynonymMap();

//     const tagNumber = 20;

//     const articleTags = [];
//     articles.forEach((element) => {
//       articleTags.push(nodejieba.extract(element.content, tagNumber));
//     });

//     console.log(articleTags);
//     console.log('---------------');

//     const articleKeyowrds = [];

//     articleTags.forEach((element) => {
//       const newElement = element.map((tag) => tag.keyword);
//       console.log(newElement);
//       articleKeyowrds.push(newElement);
//     });

//     console.log(articleKeyowrds);
//     console.log('---------------');
//     const articleNumber = articles.length;
//     console.log(articleNumber);

//     const filteredArticles = [];

//     const synonymiedArticles = await Promise.all(
//       articles.map(async (element) => {
//         const tokenizedArticle = nodejieba.cut(element.content);
//         const filteredArticle = await filterStopWords(
//           stopwordMap,
//           tokenizedArticle
//         );
//         filteredArticles.push(filteredArticle);
//         const synonymiedArticle = await findSynonym(
//           synonymMap,
//           filteredArticle
//         );
//         return synonymiedArticle;
//       })
//     );

//     console.log('---------filtered articles----------');
//     console.dir(filteredArticles);

//     const esBulkBody = [];
//     for (let i = 0; i < articleNumber; i += 1) {
//       esBulkBody.push({
//         index: {
//           _index: 'test_articles',
//         },
//       });
//       esBulkBody.push({
//         title: articles[i].title,
//         author: articles[i].author,
//         tag: articleKeyowrds[i],
//         filtered_content: filteredArticles[i],
//         processed_content: synonymiedArticles[i],
//         content: articles[i].content,
//       });
//     }

//     const responseFromES = await client.bulk({ body: esBulkBody });

//     console.log('response from elasticSearch!!');
//     console.log(responseFromES);
//     responseFromES.items.forEach((ele) => console.log(ele));

//     const articlesGraph = Graph();
//     // const matchedArticles = [];
//     const matchedArticles = {};
//     for (let i = 0; i < articleNumber; i += 1) {
//       for (let j = i + 1; j < articleNumber; j += 1) {
//         const similarity = calculateSimilarity(
//           synonymiedArticles[i],
//           synonymiedArticles[j]
//         );
//         articlesGraph.addEdge(i + 1, j + 1, similarity);
//         const [matchedArticleA, matchedArticleB] = findMatchedKeyword(
//           synonymiedArticles[i],
//           synonymiedArticles[j],
//           filteredArticles[i],
//           filteredArticles[j]
//         );

//         const matchedArticleAindices = findSimilarSentenseIndex(
//           articles[i].content,
//           matchedArticleA
//         );
//         const matchedBrticleAindices = findSimilarSentenseIndex(
//           articles[j].content,
//           matchedArticleB
//         );

//         matchedArticles[`${i + 1}-and-${j + 1}`] = [
//           matchedArticleAindices,
//           matchedBrticleAindices,
//         ];

//         // matchedArticles.push([i, j]);
//         // matchedArticles.push([matchedArticleAindices, matchedBrticleAindices]);
//       }
//     }

//     console.dir(matchedArticles);

//     console.log(articlesGraph.serialize());

//     const response = {
//       similarity: articlesGraph.serialize(),
//       sentenseIndex: matchedArticles,
//     };

//     res.send({ data: response });
//   }
// );

// app.post(
//   `/api/${process.env.API_VERSION}/analysis`,
//   authentication,
//   async (req, res) => {
//     const article = req.body.data;

//     console.log(article);
//     const articleSplit = nodejieba.cut(article.content);
//     const tagNumber = 20;
//     const articleTag = nodejieba.extract(article.content, tagNumber);
//     const articleTagKeywords = articleTag.map((element) => element.keyword);

//     console.log(articleTagKeywords);

//     const stopwordMap = await buildStopWordsMap();
//     const synonymMap = await buildSynonymMap();

//     const articleFiltered = await filterStopWords(stopwordMap, articleSplit);

//     const articleSynonymized = await findSynonym(synonymMap, articleFiltered);

//     const responseSize = 10;
//     const esQuery = [];
//     articleTagKeywords.forEach((element) => {
//       esQuery.push({ match: { tag: element } });
//     });

//     console.log('---------es query----------');
//     console.log(esQuery);

//     const searchResponse = await client.search({
//       index: process.env.DB_NAME,
//       body: {
//         size: responseSize,
//         query: {
//           bool: {
//             should: esQuery,
//             minimum_should_match: 1,
//           },
//         },
//       },
//     });

//     console.log(searchResponse);

//     console.log(searchResponse.hits.total.value);

//     const similarSentenceIndex = [];
//     const articleSimilarities = [];
//     const similarArticles = [];

//     for (
//       let i = 0;
//       i < Math.min(searchResponse.hits.total.value, responseSize);
//       i += 1
//     ) {
//       const articleSimilarity = calculateSimilarity(
//         articleSynonymized,
//         searchResponse.hits.hits[i]._source.processed_content
//       );
//       if (articleSimilarity >= 0.1) {
//         articleSimilarities.push(articleSimilarity);
//         const [matchedArticleA, matchedArticleB] = findMatchedKeyword(
//           articleSynonymized,
//           searchResponse.hits.hits[i]._source.processed_content,
//           articleFiltered,
//           searchResponse.hits.hits[i]._source.filtered_content
//         );
//         const matchedArticleAindices = findSimilarSentenseIndex(
//           article.content,
//           matchedArticleA
//         );
//         const matchedBrticleBindices = findSimilarSentenseIndex(
//           searchResponse.hits.hits[i]._source.content,
//           matchedArticleB
//         );
//         similarSentenceIndex.push([
//           matchedArticleAindices,
//           matchedBrticleBindices,
//         ]);
//         similarArticles.push(searchResponse.hits.hits[i]._source);
//       }
//     }

//     const maxSimilarity = articleSimilarities.reduce(
//       (a, b) => Math.max(a, b),
//       -Infinity
//     );

//     console.log('user_id', req.user.user_id);

//     const responseFromES = await client.index({
//       index: 'test_articles',
//       body: {
//         title: article.title,
//         author: article.author,
//         tag: articleTagKeywords,
//         filtered_content: articleFiltered,
//         processed_content: articleSynonymized,
//         content: article.content,
//         user_id: req.user.user_id,
//         similar_articles: articleSimilarities.length,
//         highest_similarity: maxSimilarity,
//       },
//     });

//     console.log('response from elasticSearch!!');
//     console.log(responseFromES);

//     res.send({
//       data: {
//         similarity: articleSimilarities,
//         sentenceIndex: similarSentenceIndex,
//         article: similarArticles,
//       },
//     });
//   }
// );

app.get(`/api/${process.env.API_VERSION}/articles/search`, async (req, res) => {
  const esSearchQuery = {
    must: [],
    must_not: [],
    should: [],
  };
  console.log(req.query);
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

  const searchResult = await client.search({
    index: process.env.DB_ARTICLE_NAME,
    body: {
      from: (page - 1) * pageSize,
      query: {
        bool: esSearchQuery,
      },
    },
  });

  const searchArticles = searchResult.hits.hits.map((element) => ({
    id: element._id,
    title: element._source.title,
    author: element._source.author,
    content: element._source.content,
  }));
  const response = {
    total: searchResult.hits.total.value,
    article: searchArticles,
  };
  res.send({ data: response });
});

app.get(
  `/api/${process.env.API_VERSION}/articles/details`,
  async (req, res) => {
    const { id } = req.query;
    const result = await client.search({
      index: 'test_articles',
      body: {
        query: {
          term: { _id: id },
        },
      },
    });
    const response = {
      title: result.hits.hits[0]._source.title,
      author: result.hits.hits[0]._source.author,
      content: result.hits.hits[0]._source.content,
    };
    res.status(200).send({ data: response });
  }
);

// app.get(
//   `/api/${process.env.API_VERSION}/articles`,
//   authentication,
//   async (req, res) => {
//     console.log(req.user.user_id);
//     const result = await client.search({
//       index: 'test_articles',
//       body: {
//         query: {
//           term: { 'user_id.keyword': req.user.user_id },
//         },
//       },
//     });
//     const response = [];
//     for (const article of result.hits.hits) {
//       response.push({
//         title: article._source.title,
//         author: article._source.author,
//         similar_articles: article._source.similar_articles,
//         highest_similarity: article._source.highest_similarity,
//       });
//     }
//     res.status(200).send({ data: response });
//   }
// );

app.get(`/api/${process.env.API_VERSION}/health`, (req, res) => {
  res.send('I am a healthy server!!!!');
});

// 404 error handling
// eslint-disable-next-line no-unused-vars
app.use((req, res, next) => {
  const fileName = '404.html';
  res.sendFile(fileName, options, (err) => {
    if (err) {
      next(err);
    } else {
      console.log('Sent:', fileName);
    }
  });
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
