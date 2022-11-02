/* eslint-disable no-constant-condition */
require('dotenv').config();
const { cache } = require('./cache');
const stopWord = require('../util/stopWord');
const synonym = require('../util/synonym');
const { Article } = require('../util/article');
const { findMatchedSentence, calculateSimilarity } = require('../util/compare');
const { updateArticle, updateCompareResult } = require('./model/article');

const { CHANNEL_NAME, COMPARE_FINISH, COMPARE_PENDING } = process.env;

(async () => {
  let job;
  while (true) {
    try {
      job = JSON.parse((await cache.brpop('chinese-article-compare', 0))[1]);

      const { compare_result_id, user_id } = job;

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

      source.id = job.source.id;
      target.id = job.target.id;

      source.extractTag().splitSentence().tokenizer();
      target.extractTag().splitSentence().tokenizer();

      source.filtered = stopWord.filterStopWords(source.tokens);
      target.filtered = stopWord.filterStopWords(target.tokens);

      source.synonym = synonym.findSynonym(source.filtered);
      target.synonym = synonym.findSynonym(target.filtered);

      await updateArticle(source.id, source.synonym, source.tags);
      await updateArticle(target.id, target.synonym, target.tags);

      const matchResult = findMatchedSentence(source.synonym, target.synonym);

      const similarity = calculateSimilarity(
        source.synonym.flat(),
        target.synonym.flat()
      );

      await updateCompareResult(
        compare_result_id,
        job.source.id,
        job.target.id,
        similarity,
        matchResult,
        +COMPARE_FINISH
      );

      const finishedJob = {
        user_id,
        message: 'succeed',
      };

      await cache.publish(CHANNEL_NAME, JSON.stringify(finishedJob));

      console.log('worker finished job');
    } catch (err) {
      console.log('worker failed job');
      console.log(err);
      // worker job fail handling
      if (job.retry < 3) {
        job.retry++;
        await cache.lpush(JSON.stringify(job));
        await updateCompareResult(
          job.compare_result_id,
          job.source.id,
          job.target.id,
          0,
          {
            source: [],
            target: [],
          },
          +COMPARE_PENDING
        );
      }
      const failedJob = {
        user_id: job.user_id,
        message: 'failed',
      };

      await cache.publish(CHANNEL_NAME, JSON.stringify(failedJob));
    }
  }
})();
