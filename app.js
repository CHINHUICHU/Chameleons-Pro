/* eslint-disable no-unused-vars */
require('dotenv').config();
const express = require('express');

const path = require('path');

const options = {
  root: path.join(__dirname, 'public'),
};

const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '50mb' }));
app.set('view engine', 'ejs');

const { API_VERSION } = process.env;

app.use(`/api/${API_VERSION}`, [
  require('./server/routes/user'),
  require('./server/routes/article'),
]);

app.get('/', (req, res, next) => {
  const fileName = 'index.html';
  res.sendFile(fileName, options, (err) => {
    if (err) {
      next(err);
    } else {
      console.log('Sent:', fileName);
    }
  });
});

app.get('/multiple', (req, res, next) => {
  const fileName = 'multiple.html';
  res.sendFile(fileName, options, (err) => {
    if (err) {
      next(err);
    } else {
      console.log('Sent:', fileName);
    }
  });
});

app.get('/upload', (req, res, next) => {
  const fileName = 'upload.html';
  res.sendFile(fileName, options, (err) => {
    if (err) {
      next(err);
    } else {
      console.log('Sent:', fileName);
    }
  });
});

app.get('/user', (req, res, next) => {
  const fileName = 'user.html';
  res.sendFile(fileName, options, (err) => {
    if (err) {
      next(err);
    } else {
      console.log('Sent:', fileName);
    }
  });
});

app.get('/search', (req, res, next) => {
  const fileName = 'search.html';
  res.sendFile(fileName, options, (err) => {
    if (err) {
      next(err);
    } else {
      console.log('Sent:', fileName);
    }
  });
});

app.get('/article', (req, res, next) => {
  const fileName = 'article.html';
  res.sendFile(fileName, options, (err) => {
    if (err) {
      next(err);
    } else {
      console.log('Sent:', fileName);
    }
  });
});

app.get('/single', (req, res, next) => {
  const fileName = 'single.html';
  res.sendFile(fileName, options, (err) => {
    if (err) {
      next(err);
    } else {
      console.log('Sent:', fileName);
    }
  });
});

app.get('/login', (req, res, next) => {
  const fileName = 'login.html';
  res.sendFile(fileName, options, (err) => {
    if (err) {
      next(err);
    } else {
      console.log('Sent:', fileName);
    }
  });
});

app.get(`/api/${API_VERSION}/health`, (req, res) => {
  res.send('I am a healthy server!!!!');
});

// 404 error handling
app.use((req, res, next) => {
  const fileName = '404.html';
  res.sendFile(fileName, options, (err) => {
    if (err) {
      next(err);
    } else {
      console.log('Sent:', fileName);
    }
  });
});

app.use((err, req, res, next) => {
  console.log('internal server error', err);
  res
    .status(500)
    .send({ error_code: 500, error_message: 'internal server error' });
});

module.exports = app;
