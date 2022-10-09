require('dotenv').config({ path: '../../.env' });
const { client } = require('../../server/models/database');

const { DB_ARTICLE_INDEX, DB_COMPARE_INDEX, COMPARE_FINISHED } = process.env;

const updateArticle = async (articleId, processed_content, tag) => {
  try {
    const result = client.update({
      index: DB_ARTICLE_INDEX,
      id: articleId,
      doc: {
        processed_content: processed_content,
        tag: tag,
      },
    });
    return result;
  } catch (err) {
    console.log(err);
    return err;
  }
};

const updateCompareResult = async (
  compareResultId,
  similarity,
  matchResult
) => {
  try {
    const result = client.update({
      index: DB_COMPARE_INDEX,
      id: compareResultId,
      doc: {
        matchResult: {
          sentences: matchResult,
          similarity: similarity,
        },
        status: +COMPARE_FINISHED,
      },
    });
    return result;
  } catch (err) {
    console.log(err);
    return err;
  }
};

module.exports = {
  updateArticle,
  updateCompareResult,
};
