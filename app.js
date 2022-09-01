const express = require('express');

const app = express();
app.use(express.static('public'));

app.listen(process.env.SERVER_PORT, () => {
  console.log(`server is listening on port ${process.env.SERVER_PORT}...`);
});
