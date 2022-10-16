/* eslint-disable no-constant-condition */
require('dotenv').config();
const { cache } = require('./cache');
const stopWord = require('../util/stopWord');
const synonym = require('../util/synonym');
const { Article } = require('../util/article');
const { findMatchedSentence, calculateSimilarity } = require('../util/compare');
const { updateArticle, insertCompareResult } = require('./model/article');

const {
  MODE_SINGLE,

  CHANNEL_NAME,
} = process.env;

(async () => {
  while (true) {
    try {
      const job = JSON.parse(
        (await cache.brpop('chinese-article-compare', 0))[1]
      );

      const { user_id } = job;

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

      const matchResult = findMatchedSentence(
        source.sentences,
        target.sentences,
        source.synonym,
        target.synonym
      );

      const similarity = calculateSimilarity(
        source.synonym.flat(),
        target.synonym.flat()
      );

      // await updateCompareResult(compare_result_id, similarity, compareResult);

      const compareResult = {
        user_id: user_id,
        compare_mode: +MODE_SINGLE,
        match_result: [
          {
            similarity: similarity,
            source_id: source.id,
            target_id: target.id,
            sentences: matchResult,
          },
        ],
        create_time: Date.now(),
      };

      await insertCompareResult(compareResult);

      const finishedJob = {
        user_id,
      };

      await cache.publish(CHANNEL_NAME, JSON.stringify(finishedJob));
    } catch (err) {
      console.log(err);
    }
  }
})();
