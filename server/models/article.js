const { client } = require('./database');

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
            _index: 'test_articles',
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
            _index: 'test_articles',
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
      index: process.env.DB_ARTICLE_NAME,
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

module.exports = { insertTwoArticles, insertMultipleArticles, searchArticles };
