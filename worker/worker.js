require('dotenv').config();
const { cache } = require('./cache');
const stopWord = require('../util/stopWord');
const synonym = require('../util/synonym');
const { Article, Articles } = require('../util/article');
const { findMatchedSentence, calculateSimilarity } = require('../util/compare');
const { updateArticle, updateCompareResult } = require('./model/article');
const { parentPort } = require('worker_threads');
const _ = require('lodash');

(async () => {
  //   while (true) {
  try {
    //   const job = JSON.parse(await cache.brpop('test-1', 0));
    const job = JSON.parse(await cache.rpop('chinese-article-compare'));
    console.log('job', job);

    if (job !== null) {
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

      parentPort.postMessage(finishedJob);
    }
  } catch (err) {
    console.log(err);
  }
  //   }
})();
