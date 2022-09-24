$(document).ready(async () => {
  $('#article-area').empty();
  const articleId = localStorage.getItem('articleId');
  console.log(articleId);
  const response = await axios.get(`/api/1.0/articles/details?id=${articleId}`);
  console.log(response);
  const article = response.data.data;
  $(`<h4>${article.title}</h4>`).appendTo('#article-area');
  $(`<div>${article.author}</div>`)
    .css({ 'margin-bottom': '5%' })
    .appendTo('#article-area');
  let content = '';
  const contentSpilt = article.content.split('\n');
  contentSpilt.forEach((element) => {
    content += `<p>${element}</p>`;
  });
  $(`<div>${content}</div>`).appendTo('#article-area');
});
