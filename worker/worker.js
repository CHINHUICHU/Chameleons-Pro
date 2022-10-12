require('dotenv').config();
const { cache } = require('./cache');
const stopWord = require('../util/stopWord');
const synonym = require('../util/synonym');
const { Article, Articles } = require('../util/article');
const { findMatchedSentence, calculateSimilarity } = require('../util/compare');
const {
  updateArticle,
  updateCompareResult,
  insertCompareResult,
} = require('./model/article');
// const _ = require('lodash');
const Graph = require('graph-data-structure');

const { MODE_SINGLE, MODE_MULTIPLE, MODE_UPLOAD } = process.env;

(async () => {
  while (true) {
    try {
      const job = JSON.parse(
        (await cache.brpop('chinese-article-compare', 0))[1]
      );

      if (job.compare_mode === +MODE_SINGLE) {
        const { user_id, compare_result_id, compare_mode } = job;

        const source = new Article(
          job.source.title,
          job.source.author,
          job.source.content
        );
        const target = new Article(
          job.target.title,
          job.target.author,
          job.target.content
        );

        source.extractTag().splitSentence().tokenizer();
        target.extractTag().splitSentence().tokenizer();

        source.filtered = stopWord.filterStopWords(source.tokens);
        target.filtered = stopWord.filterStopWords(target.tokens);

        source.synonym = synonym.findSynonym(source.filtered);
        target.synonym = synonym.findSynonym(target.filtered);

        await updateArticle(job.source_id, source.synonym, source.tags);
        await updateArticle(job.target_id, target.synonym, target.tags);

        const compareResult = findMatchedSentence(
          source.sentences,
          target.sentences,
          source.synonym,
          target.synonym
        );

        const similarity = calculateSimilarity(
          source.synonym.flat(),
          target.synonym.flat()
        );

        await updateCompareResult(compare_result_id, similarity, compareResult);

        const finishedJob = {
          source,
          target,
          similarity,
          compareResult,
          user_id,
          compare_result_id,
          compare_mode,
        };

        await cache.publish('my-channel', 'single finish');
      }
      if (job.compare_mode === +MODE_MULTIPLE) {
        const articles = new Articles();

        const updateArticles = [];

        job.articles.forEach((element) => {
          // article preprocessing
          const article = articles.newArticle(
            element.title,
            element.author,
            element.content
          );

          article.id = element.id;

          article.extractTag().splitSentence().tokenizer();
          article.filtered = stopWord.filterStopWords(article.tokens);
          article.synonym = synonym.findSynonym(article.filtered);
          updateArticles.push(
            updateArticle(article.id, article.synonym, article.tags)
          );
        });

        await Promise.all(updateArticles);

        const articlesGraph = Graph();
        const matchedArticles = {};

        const compareResult = [];

        // article comparison
        for (let i = 0; i < articles.numberOfArticles; i += 1) {
          for (let j = i + 1; j < articles.numberOfArticles; j += 1) {
            const similarity = calculateSimilarity(
              articles.all[i].synonym.flat(),
              articles.all[j].synonym.flat()
            );

            articlesGraph.addEdge(i + 1, j + 1, similarity);

            // find matched sentences between two articles
            const matchResult = findMatchedSentence(
              articles.all[i].sentences,
              articles.all[j].sentences,
              articles.all[i].synonym,
              articles.all[j].synonym
            );

            matchedArticles[`${i + 1}-and-${j + 1}`] = matchResult;

            // prepare compare result to insert into database
            compareResult.push(
              {
                index: {
                  _index: process.env.DB_COMPARE_INDEX,
                },
              },
              {
                compare_mode: 2,
                similarity,
                source_id: articles.all[i].id,
                target_id: articles.all[j].id,
                sentences: matchResult,
              }
            );
          }
        }

        await insertCompareResult({
          user_id: job.user_id,
          compare_mode: +MODE_MULTIPLE,
          match_result: compareResult,
          create_time: Date.now(),
        });

        await cache.publish('my-channel', 'multiple finish');
      }
    } catch (err) {
      console.log(err);
    }
  }
})();
