/* eslint-disable no-undef */
$(document).ready(async () => {
  $.fn.showFlex = function () {
    this.show();
    this.css('display', 'flex');
    this.css('justify-content', 'space-around');
  };

  $('#article-search').change(() => {
    localStorage.setItem('search', $('#article-search').val());
    window.location.href = '/search';
  });

  $('#finish>button').click(async () => {
    if (
      validator.isEmpty($('#article-A-title').val()) ||
      validator.isEmpty($('#article-A-author').val()) ||
      validator.isEmpty($('#article-A-content').val()) ||
      validator.isEmpty($('#article-B-title').val()) ||
      validator.isEmpty($('#article-B-author').val()) ||
      validator.isEmpty($('#article-B-content').val())
    ) {
      Swal.fire({
        icon: 'error',
        text: '文章標題、作者與內文為必填資訊',
        showConfirmButton: false,
      });
      return;
    }

    if (
      !validator.isLength($('#article-A-title').val(), { min: 1, max: 50 }) ||
      !validator.isLength($('#article-B-title').val(), { min: 1, max: 50 })
    ) {
      Swal.fire({
        icon: 'error',
        text: '文章標題字數上限為50字',
        showConfirmButton: false,
      });
      return;
    }

    if (
      !validator.isLength($('#article-A-author').val(), { min: 1, max: 20 }) ||
      !validator.isLength($('#article-B-author').val(), { min: 1, max: 20 })
    ) {
      Swal.fire({
        icon: 'error',
        text: '作者欄位字數上限為20字',
        showConfirmButton: false,
      });
      return;
    }

    if (
      !validator.isLength($('#article-A-content').val(), {
        min: 1,
        max: 100000,
      }) ||
      !validator.isLength($('#article-B-content').val(), {
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

    const token = localStorage.getItem('jwt');
    const header = {
      'Content-Type': 'application/json',
      Authorization: token,
    };

    const response = await axios.post(
      '/api/1.0/articles/single',
      {
        data: {
          sourceArticle: {
            title: $('#article-A-title')
              .val()
              .replaceAll('<', '&lt;')
              .replaceAll('>', '&gt;'),
            author: $('#article-A-author')
              .val()
              .replaceAll('<', '&lt;')
              .replaceAll('>', '&gt;'),
            content: $('#article-A-content')
              .val()
              .replaceAll('<', '&lt;')
              .replaceAll('>', '&gt;'),
          },
          targetArticle: {
            title: $('#article-B-title')
              .val()
              .replaceAll('<', '&lt;')
              .replaceAll('>', '&gt;'),
            author: $('#article-B-author')
              .val()
              .replaceAll('<', '&lt;')
              .replaceAll('>', '&gt;'),
            content: $('#article-B-content')
              .val()
              .replaceAll('<', '&lt;')
              .replaceAll('>', '&gt;'),
          },
        },
      },
      { headers: header }
    );

    const { matchResult, similarity } = response.data.data;

    $('#top').showFlex();
    $('#nav').hide();
    $('#main').hide();
    $('#finish').hide();
    $('#result').showFlex();
    $('#main-result').showFlex();

    $('#similarity').html(`相似度：${(similarity * 100).toFixed(2)}%`);

    $('#progress>div').css({
      style: `width: ${similarity}`,
    });

    const sourceArticleParagraphs = $('#article-A-content').val().split('\n');
    const targetArticleParagraphs = $('#article-B-content').val().split('\n');

    let sourceArticleWithParagraph = '';
    let targetArticleWithParagraph = '';
    for (const paragraph of sourceArticleParagraphs) {
      sourceArticleWithParagraph += `<p>${paragraph}</p>`;
    }
    for (const paragraph of targetArticleParagraphs) {
      targetArticleWithParagraph += `<p>${paragraph}</p>`;
    }

    $('#result-A-title').val($('#article-A-title').val());
    $('#result-A-author').val($('#article-A-author').val());
    $('#result-A-content').html(sourceArticleWithParagraph);

    $('#result-B-title').val($('#article-B-title').val());
    $('#result-B-author').val($('#article-B-author').val());
    $('#result-B-content').html(targetArticleWithParagraph);

    for (const matchSentence of matchResult) {
      $('#result-A-content').mark(matchSentence.sourceSentence);
      $('#result-B-content').mark(matchSentence.targetSentence);
    }
  });
});
