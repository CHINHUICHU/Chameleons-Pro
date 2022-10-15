const router = require('express').Router();
const { wrapAsync, appAuth } = require('../../util/util');
const { signUp, signIn, getUserProfile } = require('../controllers/user');
const {
  nameValidator,
  emailValidator,
  passwordValidator,
} = require('../../util/validation');

router
  .route('/user/signup')
  .post(
    nameValidator(),
    emailValidator(),
    passwordValidator(),
    wrapAsync(signUp)
  );

router
  .route('/user/signin')
  .post(emailValidator(), passwordValidator(), wrapAsync(signIn));

router
  .route('/user/profile')
  .get(wrapAsync(appAuth), wrapAsync(getUserProfile));

module.exports = router;
