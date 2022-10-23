const generateTag = function (article, compareResult) {
  let newArticle = [...article];
  for (let index of compareResult) {
    newArticle[index] = `<mark>${newArticle[index]}</mark>`;
  }
  return newArticle;
};

module.exports = { generateTag };
