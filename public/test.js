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
    $('<textarea></textarea>')
      .attr('id', `article-${comparedArticles}`)
      .addClass('article')
      .appendTo('#multiple');
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

    localStorage.setItem(
      'sentence-index',
      JSON.stringify(response.data.sentenseIndex)
    );

    const edges = response.data.similarity.links;

    const edgeNumber = edges.length;

    for (let i = 0; i < edgeNumber; i += 1) {
      $('#multiple-result').append(
        `<div>文章${+edges[i].source}與文章${+edges[i].target}的相似度為${(
          +edges[i].weight * 100
        ).toFixed(2)}%</div>`
      );
      $('<button>查看相似段落</button>')
        .attr('id', `${+edges[i].source}-and-${+edges[i].target}`)
        .addClass('check-similar-paragraph')
        .appendTo('#multiple-result');
    }

    $('.check-similar-paragraph').click(function (e) {
      e.stopPropagation();
      $('.article-result').remove();
      const articleIds = $(this).attr('id').split('-');
      const [article1, article2] = [articleIds[0], articleIds[2]];

      $('<div></div>')
        .attr('id', `article-${article1}-result`)
        .addClass('article-result')
        .appendTo('#multiple-result');
      $(`#article-${article1}-result`).html($(`#article-${article1}`).val());

      $('<div></div>')
        .attr('id', `article-${article2}-result`)
        .addClass('article-result')
        .appendTo('#multiple-result');
      $(`#article-${article2}-result`).html($(`#article-${article2}`).val());

      const article1split = $(`#article-${article1}`)
        .val()
        .split(/(?:，|。|\n|！|？|：|；)+/);
      const article1splitLength = article1split.length;

      console.log(article1split);

      const article2split = $(`#article-${article2}`)
        .val()
        .split(/(?:，|。|\n|！|？|：|；)+/);
      const article2splitLength = article2split.length;

      console.log(article2split);

      const similarSentenceIndex = JSON.parse(
        localStorage.getItem('sentence-index')
      )[`${$(this).attr('id')}`];

      // console.log(JSON.parse(similarSentenceIndex));

      for (let i = 0; i < article1splitLength; i += 1) {
        if (similarSentenceIndex[0][i]) {
          $(`#article-${article1}-result`).mark(article1split[i]);
        }
      }

      for (let i = 0; i < article2splitLength; i += 1) {
        if (similarSentenceIndex[1][i]) {
          $(`#article-${article2}-result`).mark(article2split[i]);
        }
      }
    });
  });
});
