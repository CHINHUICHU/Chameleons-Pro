/* eslint-disable no-undef */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-syntax */
$(document).ready(async () => {
  $('#upload-submit').click(async () => {
    $('#upload-article-area').hide();
    const token = localStorage.getItem('jwt');
    const header = {
      'Content-Type': 'application/json',
      Authorization: token,
    };
    const uploadArticle = {
      title: $('#upload-article-title').val(),
      author: $('#upload-article-author').val(),
      content: $('#upload-article-content').val(),
    };
    try {
      const response = await axios.post(
        '/api/1.0/articles/analysis',
        {
          data: uploadArticle,
        },
        { headers: header }
      );

      console.log(response.data.data);

      const { article, similarity, sentenceIndex } = response.data.data;

      const articleNumber = article.length;
      $(`<h2>該文章共與${articleNumber}篇文章相似度超過10%</h2>`)
        .css({ 'padding-left': '5%', 'margin-bottom': '5%' })
        .appendTo('#upload-result');

      for (let i = 0; i < articleNumber; i += 1) {
        $('<div class="upload-result-area"></div>').appendTo('#upload-result');
        $(`<div class="input-group mb-3">
        <div class="input-group-prepend shadow-sm">
          <span class="input-group-text">標題</span>
        </div>
        <input type="text" class="form-control" aria-label="Default" aria-describedby="inputGroup-sizing-default" id="upload-result-title-${i}" readonly>
      </div>`)
          .css({ 'padding-left': '5%', 'padding-right': '5%' })
          .appendTo('.upload-result-area:last');

        $(`#upload-result-title-${i}`).val(article[i].title);

        $(`<div class="input-group mb-3">
      <div class="input-group-prepend shadow-sm">
        <span class="input-group-text">作者</span>
      </div>
      <input type="text" class="form-control" aria-label="Default" aria-describedby="inputGroup-sizing-default" id="upload-result-author-${i}" readonly>
    </div>`)
          .css({ 'padding-left': '5%', 'padding-right': '5%' })
          .appendTo('.upload-result-area:last');

        $(`#upload-result-author-${i}`).val(article[i].author);

        $(`<div class="input-group mb-3">
    <div class="input-group-prepend shadow-sm">
      <span class="input-group-text">相似度</span>
    </div>
    <input type="text" class="form-control" aria-label="Default" aria-describedby="inputGroup-sizing-default" id="upload-result-similartiy-${i}" readonly>
  </div>`)
          .css({ 'padding-left': '5%', 'padding-right': '5%' })
          .appendTo('.upload-result-area:last');

        $(`#upload-result-similartiy-${i}`).val(
          `${(similarity[i] * 100).toFixed(2)}%`
        );

        $('<button type="button">查看相似段落</button>')
          .attr('id', `check-similar-paragraph-${i}`)
          .css({ 'margin-left': '5%', 'margin-bottom': '3%' })
          .addClass('check-upload-similar-paragraph btn btn-secondary')
          .appendTo('.upload-result-area:last');
      }
      $('.check-upload-similar-paragraph').click(function (e) {
        e.stopPropagation();
        $('#article-result').remove();
        const articleId = $(this).attr('id').split('-')[3];

        $('<div></div>')
          .attr('id', 'article-result')
          .css({
            display: 'flex',
            'justify-content': 'space-around',
            'padding-left': '5%',
            'padding-right': '5%',
            'margin-top': '3%',
          })
          .insertAfter($(this));

        $('<div class="shadow-sm p-3 mb-5 bg-white rounded"></div>')
          .attr('id', 'article-source-content')
          .addClass('article-result border')
          .css({
            'margin-bottom': '20px',
            width: '45%',
            height: '500px',
            'overflow-y': 'scroll',
          })
          .appendTo('#article-result');

        const articleSourceParagraphs = $('#upload-article-content')
          .val()
          .split('\n');
        const articleTargetParagraphs = article[articleId].content.split('\n');

        let articleSourceWithParagraph = '';
        let articleTargetWithParagraph = '';
        for (const paragraph of articleSourceParagraphs) {
          articleSourceWithParagraph += `<p>${paragraph}</p>`;
        }
        for (const paragraph of articleTargetParagraphs) {
          articleTargetWithParagraph += `<p>${paragraph}</p>`;
        }

        $('#article-source-content').html(articleSourceWithParagraph);

        $('<div class="shadow-sm p-3 mb-5 bg-white rounded"></div>')
          .attr('id', 'article-target-content')
          .addClass('article-result border')
          .css({
            'margin-bottom': '20px',
            width: '45%',
            height: '500px',
            'overflow-y': 'scroll',
          })
          .appendTo('#article-result');

        $('#article-target-content').html(articleTargetWithParagraph);

        const article1split = $('#upload-article-content')
          .val()
          .split(/(?:，|。|\n|！|？|：|；)+/);
        const article1splitLength = article1split.length;

        console.log(article1split);

        const article2split =
          article[articleId].content.split(/(?:，|。|\n|！|？|：|；)+/);
        const article2splitLength = article2split.length;

        console.log(article2split);

        for (let i = 0; i < article1splitLength; i += 1) {
          if (sentenceIndex[articleId][0][i]) {
            $('#article-source-content').mark(article1split[i]);
          }
        }

        for (let i = 0; i < article2splitLength; i += 1) {
          if (sentenceIndex[articleId][1][i]) {
            $('#article-target-content').mark(article2split[i]);
          }
        }
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: error.response.data.message,
      });
      $('.swal2-confirm').click(() => {
        window.location.href = '/';
      });
    }
  });
});
