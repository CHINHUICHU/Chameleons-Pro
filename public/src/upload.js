/* eslint-disable no-undef */
$(document).ready(async () => {
  $('#upload-submit').click(async () => {
    if (
      validator.isEmpty($('#upload-article-title').val()) ||
      validator.isEmpty($('#upload-article-author').val()) ||
      validator.isEmpty($('#upload-article-content').val())
    ) {
      Swal.fire({
        icon: 'error',
        text: '文章標題、作者與內文為必填資訊',
        showConfirmButton: false,
      });
      return;
    }

    if (
      !validator.isLength($('#upload-article-title').val(), { min: 1, max: 50 })
    ) {
      Swal.fire({
        icon: 'error',
        text: '文章標題字數上限為50字',
        showConfirmButton: false,
      });
      return;
    }

    if (
      !validator.isLength($('#upload-article-author').val(), {
        min: 1,
        max: 20,
      })
    ) {
      Swal.fire({
        icon: 'error',
        text: '作者欄位字數上限為20字',
        showConfirmButton: false,
      });
      return;
    }

    if (
      !validator.isLength($('#upload-article-content').val(), {
        min: 1,
        max: 100000,
      })
    ) {
      Swal.fire({
        icon: 'error',
        text: '文章字數上限為十萬字',
        showConfirmButton: false,
      });
      return;
    }
    $('#upload-article-area').hide();
    const token = localStorage.getItem('jwt');
    const header = {
      'Content-Type': 'application/json',
      Authorization: token,
    };
    const uploadArticle = {
      title: $('#upload-article-title')
        .val()
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;'),
      author: $('#upload-article-author')
        .val()
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;'),
      content: $('#upload-article-content')
        .val()
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;'),
    };
    try {
      const response = await axios.post(
        '/api/1.0/articles/analysis',
        {
          data: uploadArticle,
        },
        { headers: header }
      );

      const { article, similarity, matchResult } = response.data.data;

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

        for (const matchSentence of matchResult[articleId]) {
          $('#article-source-content').mark(matchSentence.sourceSentence);
          $('#article-target-content').mark(matchSentence.targetSentence);
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
