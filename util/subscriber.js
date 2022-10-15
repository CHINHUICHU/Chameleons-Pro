const { cache } = require('./cache');

const { CHANNEL_NAME } = process.env;

const subscriber = cache.duplicate();

subscriber.subscribe(CHANNEL_NAME, (err, count) => {
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

module.exports = { subscriber };
