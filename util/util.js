require('dotenv').config();
const jwt = require('jsonwebtoken');
const { getUserProfile } = require('../server/models/user');
const { promisify } = require('util');

const appAuth = async (req, res, next) => {
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

const socketAuth = async (socket, next) => {
  let accessToken = socket.handshake.auth.token;

  if (accessToken === 'null' || !accessToken) {
    const err = new Error('not authorized');
    err.data = { status_code: 401, message: 'please sign in or sign up' };
    return next(err);
  }

  accessToken = accessToken.replace('Bearer ', '');

  try {
    const user = await promisify(jwt.verify)(
      accessToken,
      process.env.SECRET_TOKEN
    );

    const result = await getUserProfile(user);

    socket.user = {
      user_id: result.data.hits.hits[0]._id,
      name: result.data.hits.hits[0]._source.name,
      email: user.email,
    };

    // socket.join(socket.user.user_id);

    return next();
  } catch (err) {
    const error = new Error('wrong token');
    error.data = { status_code: 403, message: 'the token is wrong' };

    return next(error);
  }
};

const wrapAsync = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};

module.exports = {
  appAuth,
  socketAuth,
  wrapAsync,
};
