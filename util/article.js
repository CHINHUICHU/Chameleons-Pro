require('dotenv').config();
const createJieba = require('js-jieba');
const {
  JiebaDict,
  HMMModel,
  UserDict,
  IDF,
  StopWords,
} = require('jieba-zh-tw');

const jieba = createJieba(JiebaDict, HMMModel, UserDict, IDF, StopWords);

const { LENGTHY_ARTICLE_THRESHOLD } = process.env;

class Article {
  id;
  tokens = [];
  tags = [];
  #TAG_NUMBER;
  filtered = [];
  synonym = [];

  constructor(title, author, content) {
    (this.title = title), (this.author = author), (this.content = content);
    this.#TAG_NUMBER = Math.ceil(this.content.length / 100);
  }

  splitSentence() {
    this.sentences = this.content.split(/(?=，|。|\n|！|？|：|；)+/);
    return this;
  }

  tokenizer() {
    for (const sentence of this.sentences) {
      this.tokens.push(jieba.cut(sentence));
    }

    return this;
  }

  extractTag() {
    this.tags = jieba
      .extract(this.content, this.#TAG_NUMBER)
      .map((element) => element.word);
    return this;
  }
}

class Articles {
  constructor() {
    this.articles = [];
  }

  newArticle(title, author, content) {
    let article = new Article(title, author, content);
    this.articles.push(article);
    return article;
  }

  get all() {
    return this.articles;
  }

  get numberOfArticles() {
    return this.articles.length;
  }

  checkLengthyContent() {
    return this.articles.some((article) => {
      article.content >= +LENGTHY_ARTICLE_THRESHOLD;
    });
  }
}

module.exports = { Article, Articles };
