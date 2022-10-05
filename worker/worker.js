require('dotenv').config();
const { cache } = require('./cache');
const { client } = require('./database');

// (async () => {
//   while (cache.ready) {
//     try {
//       const job = await cache.brpop('chinese-article-compare');
//       console.log('worker got job');
//       console.log(JSON.parse(job));
//     } catch (err) {
//       console.log(err);
//     }
//   }
// })();
