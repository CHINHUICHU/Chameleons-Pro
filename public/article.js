$(document).ready(async () => {
  const articleId = localStorage.getItem('articleId');
  const response = await axios.get(`/api/1.0/articles/details?id=${articleId}`);
  console.log(response);
});
