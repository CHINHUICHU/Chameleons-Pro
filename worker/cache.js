require('dotenv').config();
const Redis = require('ioredis');

const cache = new Redis({
  port: process.env.CACHE_PORT,
  host: process.env.CACHE_HOST,
  username: process.env.CACHE_USER,
  password: process.env.CACHE_PASSWORD,
  db: process.env.CACHE_DB,
  //   tls: {},
});

cache.ready = false;
cache.on('ready', () => {
  cache.ready = true;
  console.log('Worker cache is ready');
});

cache.on('error', () => {
  cache.ready = false;
  console.log('Error in worker cache');
});

cache.on('end', () => {
  cache.ready = false;
  console.log('Worker cache is disconnected');
});

module.exports = { cache };
