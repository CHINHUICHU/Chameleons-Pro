const { check } = require('express-validator');

const userValidator = () => {
  return [
    check('name')
      .notEmpty()
      .withMessage('使用者名稱、Email與密碼為必填資訊')
      .isLength({ max: 20 })
      .withMessage('姓名長度不可超過20個字'),
    check('email')
      .notEmpty()
      .withMessage('使用者名稱、Email與密碼為必填資訊')
      .isEmail()
      .withMessage('Email格式錯誤')
      .isLength({ max: 40 })
      .withMessage('Email長度不可超過40個字元'),
    check('password')
      .notEmpty()
      .withMessage('使用者名稱、Email與密碼為必填資訊')
      .isLength({ max: 40 })
      .withMessage('密碼長度不可超過40個字元')
      .isAlphanumeric()
      .withMessage('密碼只能包含大小寫英文字母與數字'),
  ];
};

module.exports = { userValidator };
