const generateTag = function (article, compareResult) {
  let newArticle = [...article];
  let markArticle = '';

  for (let index of compareResult) {
    newArticle[index] = `<mark>${newArticle[index]}</mark>`;
  }

  for (let sentence of newArticle) {
    markArticle += sentence;
  }

  return markArticle;
};

module.exports = { generateTag };
