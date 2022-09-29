require('dotenv').config();
const validator = require('validator');
const User = require('../models/user');

const signUp = async (req, res) => {
  const user = req.body.data;
  if (
    !user.name ||
    !user.email ||
    !user.password ||
    validator.isEmpty(user.name) ||
    validator.isEmpty(user.email) ||
    validator.isEmpty(user.password)
  ) {
    return res.status(400).send({
      status_code: 400,
      message: '使用者名稱、Email與密碼為必填資訊',
    });
  }

  if (!validator.isEmail(user.email)) {
    return res.status(400).send({
      status_code: 400,
      message: 'Email格式錯誤',
    });
  }

  if (!validator.isLength(user.name, { min: 1, max: 20 })) {
    return res.status(400).send({
      status_code: 400,
      message: '姓名長度不可超過20個字',
    });
  }

  if (!validator.isLength(user.email, { min: 1, max: 40 })) {
    return res.status(400).send({
      status_code: 400,
      message: 'Email長度不可超過40個字元',
    });
  }

  if (!validator.isLength(user.password, { min: 1, max: 40 })) {
    return res.status(400).send({
      status_code: 400,
      message: '密碼長度不可超過40個字元',
    });
  }

  if (!validator.isAlphanumeric(user.password)) {
    return res.status(400).send({
      status_code: 400,
      message: '密碼只能包含大小寫英文字母與數字',
    });
  }

  const result = await User.signUp(user);
  return res.status(result.status_code).send(result);
};

const signIn = async (req, res) => {
  const user = req.body.data;

  if (
    !user.email ||
    !user.password ||
    validator.isEmpty(user.email) ||
    validator.isEmpty(user.password)
  ) {
    return res.status(400).send({
      status_code: 400,
      message: 'Email與密碼為必填資訊',
    });
  }

  if (!validator.isEmail(user.email)) {
    return res.status(400).send({
      status_code: 400,
      message: 'Email格式錯誤',
    });
  }

  if (!validator.isLength(user.email, { min: 1, max: 40 })) {
    return res.status(400).send({
      status_code: 400,
      message: 'Email長度不可超過40個字元',
    });
  }

  if (!validator.isLength(user.password, { min: 1, max: 40 })) {
    return res.status(400).send({
      status_code: 400,
      message: '密碼長度不可超過40個字元',
    });
  }

  if (!validator.isAlphanumeric(user.password)) {
    return res.status(400).send({
      status_code: 400,
      message: '密碼只能包含大小寫英文字母與數字',
    });
  }

  const result = await User.signIn(user);
  return res.status(result.status_code).send(result);
};

const getUserProfile = async (req, res) => {
  res.status(200).send({ status_code: 200, data: req.user });
};

module.exports = { signUp, signIn, getUserProfile };
