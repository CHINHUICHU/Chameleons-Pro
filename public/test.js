/* eslint-disable func-names */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-undef */

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
    $('.article:first').clone().appendTo('#multiple');
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
      url: 'http://localhost:3000/api/1.0/comparison',
      data: {
        articleA: $('#article-A').val(),
        articleB: $('#article-B').val(),
      },
      dataType: 'json',
      crossDomain: true,
    });

    console.log(response);

    $('#main').hide();
    $('#finish').hide();
    $('#result').showFlex();

    $('#similarity').html(response.data.similarity);
    $('#progress-bar').css('height', '20px');
    $('#progress-bar').css('width', '500px');
    $('#progress-bar').css('background', 'orange');
    $('#progress-bar').progressbar({
      value: response.data.similarity * 100,
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
});
