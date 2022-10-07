const createJieba = require('js-jieba');
const {
  JiebaDict,
  HMMModel,
  UserDict,
  IDF,
  StopWords,
} = require('jieba-zh-tw');

const jieba = createJieba(JiebaDict, HMMModel, UserDict, IDF, StopWords);

class Article {
  tokens = [];
  tags = [];
  #TAG_NUMBER = 20;
  filtered = [];
  synonym = [];

  constructor(title, author, content) {
    (this.title = title), (this.author = author), (this.content = content);
  }

  splitSentence() {
    this.sentences = this.content.split(/(?:，|。|\n|！|？|：|；)+/);
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
}

module.exports = { Article, Articles };
