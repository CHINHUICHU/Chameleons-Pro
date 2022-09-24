/* eslint-disable no-undef */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-syntax */
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
    const response = await axios.post('/api/1.0/articles/single', {
      data: {
        sourceArticle: {
          title: $('#article-A-title').val(),
          author: $('#article-A-author').val(),
          content: $('#article-A-content').val(),
        },
        targetArticle: {
          title: $('#article-B-title').val(),
          author: $('#article-B-author').val(),
          content: $('#article-B-content').val(),
        },
      },
    });

    console.log('response', response);

    const { sourceArticle, targetArticle, similarity } = response.data.data;

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

    console.log($('#article-A-content').val());
    console.log($('#article-B-content').val());

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

    const sourceArticlesSplit = $('#article-A-content')
      .val()
      .split(/(?:，|。|\n|！|？|：|；)+/);
    const sourceArticlesSplitLength = sourceArticlesSplit.length;

    const targetArticleSplit = $('#article-B-content')
      .val()
      .split(/(?:，|。|\n|！|？|：|；)+/);
    const targetArticleSplitLength = targetArticleSplit.length;

    console.log(sourceArticlesSplit);
    console.log(targetArticleSplit);

    $('#result-A-title').val($('#article-A-title').val());
    $('#result-A-author').val($('#article-A-author').val());
    $('#result-A-content').html(sourceArticleWithParagraph);

    $('#result-B-title').val($('#article-B-title').val());
    $('#result-B-author').val($('#article-B-author').val());
    $('#result-B-content').html(targetArticleWithParagraph);

    for (let i = 0; i < sourceArticlesSplitLength; i += 1) {
      if (sourceArticle[i]) {
        $('#result-A-content').mark(sourceArticlesSplit[i]);
      }
    }

    for (let i = 0; i < targetArticleSplitLength; i += 1) {
      if (targetArticle[i]) {
        $('#result-B-content').mark(targetArticleSplit[i]);
      }
    }
  });

  $('.textarea-container a').click(() => {
    $('.textarea-container textarea').val('');
  });
});
