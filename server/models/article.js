require('dotenv').config();
const { client } = require('./database');

const { DB_ARTICLE_INDEX, DB_COMPARE_INDEX } = process.env;

const insertArticles = async (queryBody) => {
  try {
    const result = client.bulk({ body: queryBody });
    return result;
  } catch (error) {
    console.log(error);
    return error;
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

const searchArticle = async (page, pageSize, searchQuery) => {
  try {
    const searchResult = await client.search({
      index: process.env.DB_ARTICLE_INDEXE,
      body: {
        from: (page - 1) * pageSize,
        query: {
          bool: searchQuery,
        },
      },
    });
    return searchResult;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const searchArticlesByTag = async (responseSize, searchQuery) => {
  try {
    const searchResponse = await client.search({
      index: process.env.DB_NAME,
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

const searchArticleById = async (id) => {
  try {
    const result = await client.search({
      index: DB_ARTICLE_INDEX,
      body: {
        query: {
          term: { _id: id },
        },
      },
    });
    return result;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const getCompareResult = async (userId) => {
  try {
    const result = await client.search({
      index: DB_COMPARE_INDEX,
      body: {
        query: {
          term: {
            user_id: userId,
          },
        },
      },
    });
    return result;
  } catch (error) {
    console.log(error);
    return error;
  }
};

module.exports = {
  insertArticles,
  insertCompareResult,
  searchArticle,
  searchArticlesByTag,
  searchArticleById,
  getCompareResult,
};
