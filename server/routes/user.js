const router = require('express').Router();
const { wrapAsync, authentication } = require('../../util/util');
const { signUp, signIn, getUserProfile } = require('../controllers/user');
const { userValidator } = require('../../util/validation');

router.route('/user/signup').post(userValidator(), wrapAsync(signUp));

router.route('/user/signin').post(userValidator(), wrapAsync(signIn));

router
  .route('/user/profile')
  .get(wrapAsync(authentication), wrapAsync(getUserProfile));

module.exports = router;
