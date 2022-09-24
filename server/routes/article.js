const router = require('express').Router();
const { wrapAsync } = require('../../util/util');
const {
  comparison,
  multipleComparison,
  getArticles,
} = require('../controllers/article');

router.route('/articles/single').post(wrapAsync(comparison));

router.route('/articles/multiple').post(wrapAsync(multipleComparison));

router.route('/articles/analysis').post();

router.route('/articles/search').get(wrapAsync(getArticles));

router.route('/articles/details').get();

router.route('/articles').get();

module.exports = router;
