/* eslint-disable no-constant-condition */
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
  searchArticlesByTag,
} = require('./model/article');
const Graph = require('graph-data-structure');

const {
  MODE_SINGLE,
  MODE_MULTIPLE,
  MODE_UPLOAD,
  CHANNEL_NAME,
  UPLOAD_RESPONSE_THRESHOLD,
  UPLOAD_RESPONSE_MIN_SIMILARITY,
} = process.env;

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
          compare_mode,
        };

        await cache.publish(CHANNEL_NAME, JSON.stringify(finishedJob));
      }

      if (job.compare_mode === +MODE_MULTIPLE) {
        const { user_id, compare_mode } = job;
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
            matchedArticles[`${i + 1}-and-${j + 1}`] = {
              similarity,
              source_id: articles.all[i].id,
              target_id: articles.all[j].id,
              sentences: matchResult,
            };

            compareResult.push(matchedArticles[`${i + 1}-and-${j + 1}`]);
          }
        }

        await insertCompareResult({
          user_id: user_id,
          compare_mode: +MODE_MULTIPLE,
          match_result: compareResult,
          create_time: Date.now(),
        });

        await cache.publish(
          CHANNEL_NAME,
          JSON.stringify({
            articles: job.articles,
            user_id,
            compare_mode,
            similarity: articlesGraph.serialize(),
            matchResult: matchedArticles,
          })
        );
      }

      if (job.compare_mode === +MODE_UPLOAD) {
        const { user_id, article, compare_mode } = job;

        const uploadedArticle = new Article(
          article.title,
          article.author,
          article.content
        );

        uploadedArticle.id = article.id;

        uploadedArticle.extractTag().splitSentence().tokenizer();

        uploadedArticle.filtered = stopWord.filterStopWords(
          uploadedArticle.tokens
        );

        uploadedArticle.synonym = synonym.findSynonym(uploadedArticle.filtered);

        console.log(uploadedArticle);

        await updateArticle(
          uploadedArticle.id,
          uploadedArticle.synonym,
          uploadedArticle.tags
        );

        const searchTags = [];
        uploadedArticle.tags.forEach((element) => {
          searchTags.push({ match: { tag: element } });
        });

        const responseSize = +UPLOAD_RESPONSE_THRESHOLD;
        const searchResponse = await searchArticlesByTag(
          responseSize,
          searchTags
        );

        console.log('search response', searchResponse.hits.hits);

        const articleSimilarities = [];
        const similarArticles = [];
        const matchResult = [];
        const compareResult = [];

        for (
          let i = 0;
          i < Math.min(searchResponse.hits.total.value, responseSize);
          i += 1
        ) {
          const articleSimilarity = calculateSimilarity(
            uploadedArticle.synonym.flat(),
            searchResponse.hits.hits[i]._source.processed_content.flat()
          );
          let { title, author, content, processed_content } =
            searchResponse.hits.hits[i]._source;

          let compareArticle = new Article(title, author, content);
          compareArticle.splitSentence();

          let result = findMatchedSentence(
            uploadedArticle.sentences,
            compareArticle.sentences,
            uploadedArticle.synonym,
            processed_content
          );

          // console.log('similarity', articleSimilarity);

          if (articleSimilarity >= +UPLOAD_RESPONSE_MIN_SIMILARITY) {
            articleSimilarities.push(articleSimilarity);

            similarArticles.push({
              title,
              author,
              content,
            });

            matchResult.push(result);
          }

          compareResult.push({
            similarity: articleSimilarity,
            source_id: uploadedArticle.id,
            target_id: searchResponse.hits.hits[i]._id,
            sentences: result,
          });
        }

        await insertCompareResult({
          user_id: user_id,
          compare_mode: +MODE_UPLOAD,
          match_result: compareResult,
          create_time: Date.now(),
        });

        await cache.publish(
          CHANNEL_NAME,
          JSON.stringify({
            article,
            user_id,
            compare_mode,
            similarity: articleSimilarities,
            similarArticles,
            matchResult,
          })
        );
      }
    } catch (err) {
      console.log(err);
    }
  }
})();
