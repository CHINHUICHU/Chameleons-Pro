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
    const response = await axios.post('/api/1.0/comparison', {
      data: {
        articleA: {
          title: $('#article-A-title').val(),
          author: $('#article-A-author').val(),
          content: $('#article-A-content').val(),
        },
        articleB: {
          title: $('#article-B-title').val(),
          author: $('#article-B-author').val(),
          content: $('#article-B-content').val(),
        },
      },
    });

    console.log(response);

    const { articleA, articleB, similarity } = response.data.data;

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

    const articleAparagraphs = $('#article-A-content').val().split('\n');
    const articleBparagraphs = $('#article-B-content').val().split('\n');

    let articleAwithParagraph = '';
    let articleBwithParagraph = '';
    for (const paragraph of articleAparagraphs) {
      articleAwithParagraph += `<p>${paragraph}</p>`;
    }
    for (const paragraph of articleBparagraphs) {
      articleBwithParagraph += `<p>${paragraph}</p>`;
    }

    const articleAsplit = $('#article-A-content')
      .val()
      .split(/(?:，|。|\n|！|？|：|；)+/);
    const articleAsplitLength = articleAsplit.length;

    const articleBsplit = $('#article-B-content')
      .val()
      .split(/(?:，|。|\n|！|？|：|；)+/);
    const articleBsplitLength = articleBsplit.length;

    console.log(articleAsplit);
    console.log(articleBsplit);

    $('#result-A-title').val($('#article-A-title').val());
    $('#result-A-author').val($('#article-A-author').val());
    $('#result-A-content').html(articleAwithParagraph);

    $('#result-B-title').val($('#article-B-title').val());
    $('#result-B-author').val($('#article-B-author').val());
    $('#result-B-content').html(articleBwithParagraph);

    for (let i = 0; i < articleAsplitLength; i += 1) {
      if (articleA[i]) {
        $('#result-A-content').mark(articleAsplit[i]);
      }
    }

    for (let i = 0; i < articleBsplitLength; i += 1) {
      if (articleB[i]) {
        $('#result-B-content').mark(articleBsplit[i]);
      }
    }
  });

  $('.textarea-container a').click(() => {
    $('.textarea-container textarea').val('');
  });
});
