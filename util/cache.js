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
  console.log('Cache is ready');
});

cache.on('error', () => {
  cache.ready = false;
  console.log('Error in cache');
});

cache.on('end', () => {
  cache.ready = false;
  console.log('Cache is disconnected');
});

const subscriber = cache.duplicate();

subscriber.subscribe('my-channel', (err, count) => {
  if (err) {
    // Just like other commands, subscribe() can fail for some reasons,
    // ex network issues.
    console.error('Failed to subscribe: %s', err.message);
  } else {
    // `count` represents the number of channels this client are currently subscribed to.
    console.log(
      `Subscribed successfully! This client is currently subscribed to ${count} channels.`
    );
  }
});

subscriber.on('message', (channel, message) => {
  console.log(JSON.parse(message));
});

module.exports = { cache, subscriber };
