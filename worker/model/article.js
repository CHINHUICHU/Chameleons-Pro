require('dotenv').config();
const { client } = require('../../server/models/database');

const { DB_ARTICLE_INDEX, DB_COMPARE_INDEX, COMPARE_FINISH } = process.env;

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
  sourceId,
  targetId,
  similarity,
  matchResult
) => {
  try {
    const result = client.update({
      index: DB_COMPARE_INDEX,
      id: compareResultId,
      doc: {
        match_result: [
          {
            source_id: sourceId,
            target_id: targetId,
            sentences: matchResult,
            similarity: similarity,
          },
        ],
        status: COMPARE_FINISH,
      },
    });
    return result;
  } catch (err) {
    console.log(err);
    return err;
  }
};

const insertCompareResult = async (queryBody) => {
  try {
    const result = client.index({
      index: DB_COMPARE_INDEX,
      body: queryBody,
    });
    return result;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const searchArticlesByTag = async (responseSize, searchQuery) => {
  try {
    const searchResponse = await client.search({
      index: DB_ARTICLE_INDEX,
      body: {
        size: responseSize,
        query: {
          bool: {
            should: searchQuery,
            minimum_should_match: 1,
          },
        },
      },
    });
    return searchResponse;
  } catch (error) {
    console.log(error);
    return error;
  }
};

module.exports = {
  updateArticle,
  updateCompareResult,
  insertCompareResult,
  searchArticlesByTag,
};
