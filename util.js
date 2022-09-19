require('dotenv').config();
const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const authentication = async (req, res, next) => {
  let accessToken = req.headers.authorization;
  accessToken = accessToken.replace('Bearer ', '');
  if (accessToken === 'null') {
    res.status(401).send({ error: 'Unauthorized' });
  }
  try {
    const user = await promisify(jwt.verify)(
      accessToken,
      process.env.SECRET_TOKEN
    );
    req.user = user;
    next();
  } catch (error) {
    res.status(403).send({ error: 'Wrong token' });
  }
};

module.exports = { authentication };
