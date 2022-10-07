require('dotenv').config();
const jwt = require('jsonwebtoken');
const { getUserProfile } = require('../server/models/user');
const { promisify } = require('util');

const authentication = async (req, res, next) => {
  let accessToken = req.get('Authorization');
  if (accessToken === 'null' || !accessToken) {
    return res.status(401).send({
      status_code: 401,
      message: 'Unauthorized',
    });
  }
  accessToken = accessToken.replace('Bearer ', '');
  try {
    const user = await promisify(jwt.verify)(
      accessToken,
      process.env.SECRET_TOKEN
    );
    const result = await getUserProfile(user);
    req.user = {
      user_id: result.data.hits.hits[0]._id,
      name: result.data.hits.hits[0]._source.name,
      email: user.email,
    };
    return next();
  } catch (error) {
    console.log(error);
    return res.status(403).send({
      status_code: 403,
      message: 'Wrong token',
    });
  }
};

const wrapAsync = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};

module.exports = {
  authentication,
  wrapAsync,
};
