require('dotenv').config();
const validator = require('validator');
const User = require('../models/user');

const signUp = async (req, res) => {
  const user = req.body.data;
  if (
    !user.name ||
    !user.email ||
    !user.password ||
    validator.isEmpty(user.name)
  ) {
    return res.status(400).send({
      status_code: 400,
      message: 'Error: Email, name and password are required',
    });
  }

  if (!validator.isEmail(user.email)) {
    return res.status(400).send({
      status_code: 400,
      message: 'Error: Invalid email format',
    });
  }

  const result = await User.signUp(user);
  return res.status(result.status_code).send(result);
};

const signIn = async (req, res) => {
  const user = req.body.data;
  if (validator.isEmpty(user.email) || validator.isEmpty(user.password)) {
    return res.status(400).send({
      status_code: 400,
      message: 'Error: Email and password are required',
    });
  }
  const result = await User.signIn(user);
  return res.status(result.status_code).send(result);
};

const getUserProfile = async (req, res) => {
  res.status(200).send({ status_code: 200, data: req.user });
};

module.exports = { signUp, signIn, getUserProfile };
