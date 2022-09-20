require('dotenv').config();
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const { client } = require('./database');

const authentication = async (req, res, next) => {
  let accessToken = req.headers.authorization;
  accessToken = accessToken.replace('Bearer ', '');
  if (accessToken === 'null') {
    res.status(401).send({
      status_code: 401,
      message: 'Unauthorized',
    });
  }
  try {
    const user = await promisify(jwt.verify)(
      accessToken,
      process.env.SECRET_TOKEN
    );
    const result = await client.search({
      index: 'test_user',
      body: {
        query: {
          term: {
            email: user.email,
          },
        },
      },
    });

    req.user = {
      user_id: result.hits.hits[0]._id,
      name: user.name,
      email: user.email,
    };
    next();
  } catch (error) {
    res.status(403).send({
      status_code: 403,
      message: 'Wrong token',
    });
  }
};

module.exports = { authentication };
