require('dotenv').config();
const { Client } = require('@elastic/elasticsearch');

const client = new Client({
  node: `https://${process.env.DB_HOST}:${process.env.DB_PORT}`,
  auth: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

module.exports = { client };
