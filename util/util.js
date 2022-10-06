/* eslint-disable no-underscore-dangle */
require('dotenv').config();
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const { getUserProfile } = require('../server/models/user');

const authentication = async (req, res, next) => {
  let accessToken = req.get('Authorization');
  console.log(accessToken);
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

function findMatchedKeyword(
  articleA,
  articleB,
  articleAtaggedArray,
  articleBtaggedArray
) {
  const result = [];

  for (const source of articleAtaggedArray) {
    for (const target of articleBtaggedArray) {
      const compareSet = [];
      let matched = 0;
      // choose longer sentence to add to the set first
      if (source.length > target.length) {
        source.forEach((element) => compareSet.push(element));
        target.forEach((element) => {
          if (compareSet.includes(element)) {
            matched += 1;
          }
        });
      } else {
        target.forEach((element) => compareSet.push(element));
        source.forEach((element) => {
          if (compareSet.includes(element)) {
            matched += 1;
          }
        });
      }
      if (matched / Math.max(source.length, target.length) >= 0.5) {
        result.push({
          sourceSentence: articleA[articleAtaggedArray.indexOf(source)],
          targetSentence: articleB[articleBtaggedArray.indexOf(target)],
        });
      }
    }
  }

  return result;
}

function calculateSimilarity(articleA, articleB) {
  const articleAset = new Set();
  articleA.forEach((element) => {
    articleAset.add(element);
  });

  const articleBset = new Set();
  articleB.forEach((element) => {
    articleBset.add(element);
  });

  const intersection = new Set(
    [...articleAset].filter((element) => articleBset.has(element))
  );

  const union = new Set([...articleAset, ...articleBset]);
  const similarity = intersection.size / union.size;

  return similarity;
}

module.exports = {
  authentication,
  wrapAsync,
  findMatchedKeyword,
  calculateSimilarity,
};
