require('dotenv').config();
const { client } = require('./database');

const { DB_ARTICLE_INDEX } = process.env;

const insertTwoArticles = async (
  sourceArticle,
  targetArticle,
  sourceArticletagKeywords,
  sourceArticleFiltered,
  sourceArticlesynonymized,
  targetArticletagKeywords,
  targetArticleFiltered,
  targetArticlesynonymized
) => {
  try {
    const result = await client.bulk({
      body: [
        {
          index: {
            _index: DB_ARTICLE_INDEX,
          },
        },
        {
          title: sourceArticle.title,
          author: sourceArticle.author,
          tag: sourceArticletagKeywords,
          filtered_content: sourceArticleFiltered,
          processed_content: sourceArticlesynonymized,
          content: sourceArticle.content,
        },
        {
          index: {
            _index: DB_ARTICLE_INDEX,
          },
        },
        {
          title: targetArticle.title,
          author: targetArticle.author,
          tag: targetArticletagKeywords,
          filtered_content: targetArticleFiltered,
          processed_content: targetArticlesynonymized,
          content: targetArticle.content,
        },
      ],
    });
    return result;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const insertMultipleArticles = async (queryBody) => {
  try {
    const result = client.bulk({ body: queryBody });
    return result;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const searchArticles = async (page, pageSize, searchQuery) => {
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

const insertUploadArticle = async (
  article,
  articleTagKeywords,
  articleFiltered,
  articleSynonymized,
  userId,
  articleSimilarities,
  maxSimilarity
) => {
  try {
    const responseFromES = await client.index({
      index: DB_ARTICLE_INDEX,
      body: {
        title: article.title,
        author: article.author,
        tag: articleTagKeywords,
        filtered_content: articleFiltered,
        processed_content: articleSynonymized,
        content: article.content,
        user_id: userId,
        similar_articles: articleSimilarities.length,
        highest_similarity: maxSimilarity,
      },
    });
    return responseFromES;
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

const getRecords = async (userId) => {
  try {
    const result = await client.search({
      index: DB_ARTICLE_INDEX,
      body: {
        query: {
          term: { 'user_id.keyword': userId },
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
  insertTwoArticles,
  insertMultipleArticles,
  searchArticles,
  searchArticlesByTag,
  insertUploadArticle,
  searchArticleById,
  getRecords,
};
