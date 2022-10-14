require('dotenv').config();
const User = require('../models/user');
const { validationResult } = require('express-validator');

const signUp = async (req, res) => {
  const user = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ status_code: 400, message: errors.array()[0].msg });
  }

  const result = await User.signUp(user);
  return res.status(result.status_code).send(result);
};

const signIn = async (req, res) => {
  const user = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ status_code: 400, message: errors.array()[0].msg });
  }
  const result = await User.signIn(user);
  return res.status(result.status_code).send(result);
};

const getUserProfile = async (req, res) => {
  res.status(200).send({ status_code: 200, data: req.user });
};

module.exports = { signUp, signIn, getUserProfile };
