const router = require('express').Router();
const { wrapAsync, authentication } = require('../../util/util');
const { signUp, signIn, getUserProfile } = require('../controllers/user');

router.route('/user/signup').post(wrapAsync(signUp));

router.route('/user/signin').post(wrapAsync(signIn));

router
  .route('/user/profile')
  .get(wrapAsync(authentication), wrapAsync(getUserProfile));

module.exports = router;
