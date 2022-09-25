const router = require('express').Router();
const { wrapAsync, authentication } = require('../../util/util');
const {
  comparison,
  multipleComparison,
  getArticles,
  analyzeArticle,
  getArticleDetails,
  getArticleRecords,
} = require('../controllers/article');

router.route('/articles/single').post(wrapAsync(comparison));

router.route('/articles/multiple').post(wrapAsync(multipleComparison));

router
  .route('/articles/analysis')
  .post(wrapAsync(authentication), wrapAsync(analyzeArticle));

router.route('/articles/search').get(wrapAsync(getArticles));

router.route('/articles/details').get(wrapAsync(getArticleDetails));

router
  .route('/articles/records')
  .get(wrapAsync(authentication), wrapAsync(getArticleRecords));

module.exports = router;
