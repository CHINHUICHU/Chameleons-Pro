const router = require('express').Router();
const { wrapAsync, appAuth } = require('../../util/util');
const {
  comparison,
  multipleComparison,
  getArticles,
  analyzeArticle,
  getArticleDetails,
  getArticleRecords,
} = require('../controllers/article');

router
  .route('/articles/single')
  .post(wrapAsync(appAuth), wrapAsync(comparison));

router
  .route('/articles/multiple')
  .post(wrapAsync(appAuth), wrapAsync(multipleComparison));

router
  .route('/articles/analysis')
  .post(wrapAsync(appAuth), wrapAsync(analyzeArticle));

router.route('/articles/search').get(wrapAsync(getArticles));

router.route('/articles/details').get(wrapAsync(getArticleDetails));

router
  .route('/articles/records')
  .get(wrapAsync(appAuth), wrapAsync(getArticleRecords));

module.exports = router;
