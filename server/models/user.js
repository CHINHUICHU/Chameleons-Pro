/* eslint-disable no-underscore-dangle */
require('dotenv').config();
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { client } = require('./database');

const { DB_USER_INDEX } = process.env;

const signUp = async (user) => {
  try {
    const checkEmail = await client.search({
      index: DB_USER_INDEX,
      body: {
        query: {
          term: {
            email: user.email,
          },
        },
      },
    });

    if (checkEmail.hits.total.value) {
      return {
        status_code: 400,
        message: 'Error: The email has been signed up',
      };
    }

    const hash = await argon2.hash(user.password);
    const result = await client.index({
      index: DB_USER_INDEX,
      body: {
        name: user.name,
        email: user.email,
        password: hash,
      },
    });

    const accessToken = jwt.sign(
      {
        name: user.name,
        email: user.email,
      },
      process.env.SECRET_TOKEN,
      { expiresIn: '30d' }
    );

    return {
      status_code: 200,
      data: {
        user_id: result._id,
        name: user.name,
        email: user.email,
        access_token: accessToken,
        expires: '30 days',
      },
    };
  } catch (err) {
    console.log(err);
    return {
      status_code: 500,
      message: 'internal server error',
    };
  }
};

const signIn = async (user) => {
  try {
    const result = await client.search({
      index: DB_USER_INDEX,
      body: {
        query: {
          term: {
            email: user.email,
          },
        },
      },
    });

    if (!result.hits.total.value) {
      return {
        status_code: 400,
        message: 'Error: The email has not been signed up',
      };
    }
    if (
      await argon2.verify(result.hits.hits[0]._source.password, user.password)
    ) {
      const accessToken = jwt.sign(
        {
          name: user.name,
          email: user.email,
        },
        process.env.SECRET_TOKEN,
        { expiresIn: '30d' }
      );
      return {
        status_code: 200,
        data: {
          user_id: result.hits.hits[0]._id,
          name: user.name,
          email: user.email,
          access_token: accessToken,
          expires: '30 days',
        },
      };
    }
    return {
      status_code: 400,
      message: 'Error: Wrong password',
    };
  } catch (err) {
    console.log(err);
    return {
      status_code: 500,
      message: 'internal server error',
    };
  }
};

const getUserProfile = async (user) => {
  try {
    const result = await client.search({
      index: DB_USER_INDEX,
      body: {
        query: {
          term: {
            email: user.email,
          },
        },
      },
    });
    return { status_code: 200, data: result };
  } catch (err) {
    return {
      status_code: 500,
      message: 'internal server error',
    };
  }
};

module.exports = { signUp, signIn, getUserProfile };
