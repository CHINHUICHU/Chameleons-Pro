/* eslint-disable no-restricted-syntax */
$(document).ready(() => {
  $.fn.showFlex = function () {
    this.show();
    this.css('display', 'flex');
    this.css('justify-content', 'space-around');
  };

  $('.1-1-article').click(() => {
    $('#index').hide();
    $('#nav').showFlex();
    $('#main').showFlex();
    $('#finish').showFlex();
  });

  $('.multiple-article').click(() => {
    $('#index').hide();
    $('#multiple').css('display', 'flex');
    $('#multiple').css('flex-direction', 'column');
    $('#nav').showFlex();
    $('#multiple-finish').showFlex();
  });

  let comparedArticles = 2;
  $('#new-article').click(() => {
    comparedArticles += 1;
    $('#multiple').append(`<h2>文章${comparedArticles}</h2>`);
    const $textarea = $('<textarea>', { class: 'article' });
    $('#multiple').append($textarea);
  });

  $('.upload').click(() => {
    $('#main').hide();
    $('#drop_zone').showFlex();
  });

  $('#go-back-index').click(() => {
    $('#main').hide();
    $('#finish').hide();
    $('#nav').hide();
    $('#index').showFlex();
  });

  $('#submit').click(async () => {
    const response = await $.ajax({
      // contentType: 'application/json',
      method: 'POST',
      url: '/api/1.0/comparison',
      data: {
        articleA: $('#article-A').val(),
        articleB: $('#article-B').val(),
      },
      dataType: 'json',
      crossDomain: true,
    });

    console.log(response);

    $('#top').showFlex();
    $('#nav').hide();
    $('#main').hide();
    $('#finish').hide();
    $('#result').showFlex();

    $('#similarity').html(
      `相似度${(response.data.similarity * 100).toFixed(2)}%`
    );

    $('#progress-bar').progressbar({
      value: (response.data.similarity * 100).toFixed(2),
    });

    const articleAsplit = $('#article-A')
      .val()
      .split(/(?:，|。|\n|！|？|：|；)+/);
    const articleAsplitLength = articleAsplit.length;

    const articleBsplit = $('#article-B')
      .val()
      .split(/(?:，|。|\n|！|？|：|；)+/);
    const articleBsplitLength = articleBsplit.length;

    console.log(articleAsplit);
    console.log(articleBsplit);

    const { articleA, articleB } = response.data;

    $('#result-A').html($('#article-A').val());
    $('#result-B').html($('#article-B').val());

    for (let i = 0; i < articleAsplitLength; i += 1) {
      if (articleA[i]) {
        $('#result-A').mark(articleAsplit[i]);
      }
    }

    for (let i = 0; i < articleBsplitLength; i += 1) {
      if (articleB[i]) {
        $('#result-B').mark(articleBsplit[i]);
      }
    }
  });

  $('#multiple-submit').click(async () => {
    $('#nav').hide();
    $('#multiple').hide();
    $('#multiple-finish').hide();

    const articles = [];
    $('.article').each(function () {
      articles.push(this.value);
    });

    const response = await $.ajax({
      method: 'POST',
      url: '/api/1.0/multiple/comparison',
      data: { articles },
      dataType: 'json',
      crossDomain: true,
    });

    console.log(response.data.links.length);

    const edges = response.data.links;

    const edgeNumber = edges.length;

    for (let i = 0; i < edgeNumber; i += 1) {
      $('#multiple-result').append(
        `<div>文章${+edges[i].source + 1}與文章${
          +edges[i].target + 1
        }的相似度為${(+edges[i].weight * 100).toFixed(2)}%</div>`
      );
    }
  });
});
