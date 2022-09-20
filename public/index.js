/* eslint-disable no-undef */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-syntax */
$(document).ready(async () => {
  $.fn.showFlex = function () {
    this.show();
    this.css('display', 'flex');
    this.css('justify-content', 'space-around');
  };

  const token = localStorage.getItem('jwt');

  console.log(token);

  const header = {
    'Content-Type': 'application/json',
    Authorization: token,
  };

  if (token) {
    const response = await axios.get('/api/1.0/user/profile', {
      headers: header,
    });
    console.log(response);
  }

  $('#single-compare-link').click(() => {
    $('#multiple').hide();
    $('#multiple-finish').hide();
    $('#upload-article-area').hide();
    $('#upload-finish').hide();
    $('#user-signin-signup').hide();
    $('#similarity').empty();
    $('#main-result').empty();
    $('#multiple-result').empty();
    $('#upload-result').empty();
    $('#nav').showFlex();
    $('#main').showFlex();
    $('#finish').showFlex();
  });

  $('#multiple-compare-link').click(() => {
    $('#main').hide();
    $('#finish').hide();
    $('#upload-article-area').hide();
    $('#upload-finish').hide();
    $('#user-signin-signup').hide();
    $('#similarity').empty();
    $('#main-result').empty();
    $('#multiple-result').empty();
    $('#upload-result').empty();
    $('#multiple').css('display', 'flex');
    $('#multiple').css('flex-direction', 'column');
    $('#nav').showFlex();
    $('#multiple-finish').showFlex();
  });

  $('#upload-compare-link').click(() => {
    $('#main').hide();
    $('#finish').hide();
    $('#multiple').hide();
    $('#multiple-finish').hide();
    $('#user-signin-signup').hide();
    $('#similarity').empty();
    $('#main-result').empty();
    $('#multiple-result').empty();
    $('#upload-result').empty();
    $('#upload-article-area').showFlex();
    $('#upload-finish').show();
    $('#upload-article-area').css('flex-direction', 'column');
  });

  $('#signup-signin-link').click(() => {
    $('#main').hide();
    $('#finish').hide();
    $('#multiple').hide();
    $('#multiple-finish').hide();
    $('#upload-article-area').hide();
    $('#upload-finish').hide();
    $('#main-result').empty();
    $('#multiple-result').empty();
    $('upload-result').empty();
    $('#user-signin-signup').show();
  });

  $('#choose-signup-btn').click(() => {
    $('#signup-area').show();
    $('#signin-area').hide();
  });

  $('#choose-signin-btn').click(() => {
    $('#signin-area').show();
    $('#signup-area').hide();
  });

  $('#signup-submit').click(async () => {
    const response = await axios.post('/api/1.0/user/signup', {
      data: {
        name: $('#signup-name').val(),
        email: $('#signup-email').val(),
        password: $('#signup-password').val(),
      },
    });

    console.log(response);

    localStorage.setItem('jwt', `Bearer ${response.data.data.access_token}`);
    $('#signup-signin-link').hide();
    $('#logout-link').show();
    $('#member-link').show();
  });

  $('#signin-submit').click(async () => {
    const response = await axios.post('/api/1.0/user/signin', {
      data: {
        email: $('#signin-email').val(),
        password: $('#signin-password').val(),
      },
    });

    console.log(response);

    localStorage.setItem('jwt', `Bearer ${response.data.data.access_token}`);
    $('#signup-signin-link').hide();
    $('#logout-link').show();
    $('#member-link').show();
  });

  let comparedArticles = 1;
  $('#new-article').click(() => {
    comparedArticles += 1;
    $('#multiple-compare-article-1')
      .clone()
      .attr('id', `multiple-compare-article-${comparedArticles}`)
      .appendTo('#multiple');
    $(`#multiple-compare-article-${comparedArticles} div:nth-child(1) input`)
      .attr('id', `article-${comparedArticles}-title`)
      .val('');
    $(`#multiple-compare-article-${comparedArticles} div:nth-child(2) input`)
      .attr('id', `article-${comparedArticles}-author`)
      .val('');
    $(`#multiple-compare-article-${comparedArticles} div:nth-child(3) textarea`)
      .attr('id', `article-${comparedArticles}-content`)
      .css('height', '300px')
      .val('');
  });

  $('#remove-article').click(() => {
    $(`#multiple-compare-article-${comparedArticles}`).remove();
    comparedArticles -= 1;
  });

  $('.upload').click(() => {
    $('#main').hide();
    $('#drop_zone').showFlex();
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
    $('#result-A-content').html($('#article-A-content').val());

    $('#result-B-title').val($('#article-B-title').val());
    $('#result-B-author').val($('#article-B-author').val());
    $('#result-B-content').html($('#article-B-content').val());

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

  $('#multiple-submit').click(async () => {
    $('#nav').hide();
    $('#multiple').hide();
    $('#multiple-finish').hide();

    const articles = [];
    for (let i = 1; i <= comparedArticles; i += 1) {
      articles.push({
        title: $(`#article-${i}-title`).val(),
        author: $(`#article-${i}-author`).val(),
        content: $(`#article-${i}-content`).val(),
      });
    }

    const response = await axios.post('/api/1.0/multiple/comparison', {
      data: articles,
    });

    console.log(response);

    localStorage.setItem(
      'sentence-index',
      JSON.stringify(response.data.data.sentenseIndex)
    );

    const edges = response.data.data.similarity.links;

    const edgeNumber = edges.length;

    for (let i = 0; i < edgeNumber; i += 1) {
      const sourceTitle = $(`#article-${+edges[i].source}-title`).val();
      const targetTitle = $(`#article-${+edges[i].target}-title`).val();

      $(`<div class="input-group mb-3">
      <div class="input-group-prepend">
        <span class="input-group-text" >來源</span>
      </div>
      <input type="text" class="form-control" aria-label="Default" aria-describedby="inputGroup-sizing-default" id="source-title-${i}" readonly>
    </div>`)
        .css({ 'padding-left': '5%', 'padding-right': '5%' })
        .appendTo('#multiple-result');

      $(`#source-title-${i}`).val(sourceTitle);

      $(`<div class="input-group mb-3">
    <div class="input-group-prepend">
      <span class="input-group-text" >比對</span>
    </div>
    <input type="text" class="form-control" aria-label="Default" aria-describedby="inputGroup-sizing-default" id="target-title-${i}" readonly>
  </div>`)
        .css({ 'padding-left': '5%', 'padding-right': '5%' })
        .appendTo('#multiple-result');

      $(`#target-title-${i}`).val(targetTitle);

      $(`<div class="input-group mb-3">
  <div class="input-group-prepend">
    <span class="input-group-text" >相似度</span>
  </div>
  <input type="text" class="form-control" aria-label="Default" aria-describedby="inputGroup-sizing-default" id="similartiy-${+edges[
    i
  ].source}-and-${+edges[i].target}" readonly>
</div>`)
        .css({ 'padding-left': '5%', 'padding-right': '5%' })
        .appendTo('#multiple-result');

      $(`#similartiy-${+edges[i].source}-and-${+edges[i].target}`).val(
        `${(+edges[i].weight * 100).toFixed(2)}%`
      );

      $('<button type="button">查看相似段落</button>')
        .attr('id', `${+edges[i].source}-and-${+edges[i].target}`)
        .css({ 'margin-left': '5%', 'margin-bottom': '3%' })
        .addClass('check-similar-paragraph btn btn-secondary')
        .appendTo('#multiple-result');
    }

    $('.check-similar-paragraph').click(function (e) {
      e.stopPropagation();
      $('#article-result').remove();
      const articleIds = $(this).attr('id').split('-');
      const [article1, article2] = [articleIds[0], articleIds[2]];

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

      $('<div></div>')
        .attr('id', `article-${article1}-result`)
        .addClass('article-result border')
        .css({
          'margin-bottom': '20px',
          width: '35%',
          height: '500px',
          'overflow-y': 'scroll',
        })
        .appendTo('#article-result');
      $(`#article-${article1}-result`).html(
        $(`#article-${article1}-content`).val()
      );

      $('<div></div>')
        .attr('id', `article-${article2}-result`)
        .addClass('article-result border')
        .css({
          'margin-bottom': '20px',
          width: '35%',
          height: '500px',
          'overflow-y': 'scroll',
        })
        .appendTo('#article-result');
      $(`#article-${article2}-result`).html(
        $(`#article-${article2}-content`).val()
      );

      const article1split = $(`#article-${article1}-content`)
        .val()
        .split(/(?:，|。|\n|！|？|：|；)+/);
      const article1splitLength = article1split.length;

      console.log(article1split);

      const article2split = $(`#article-${article2}-content`)
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

  $('#upload-submit').click(async () => {
    $('#upload-article-area').hide();
    const uploadArticle = {
      title: $('#upload-article-title').val(),
      author: $('#upload-article-author').val(),
      content: $('#upload-article-content').val(),
    };
    const response = await axios.post('/api/1.0/analysis', {
      data: uploadArticle,
    });

    console.log(response.data.data);

    const { article, similarity, sentenceIndex } = response.data.data;

    const articleNumber = article.length;
    $(`<h4>該文章共與${articleNumber}篇文章相似度超過10%</h4>`)
      .css({ 'padding-left': '5%' })
      .appendTo('#upload-result');

    for (let i = 0; i < articleNumber; i += 1) {
      $(`<div class="input-group mb-3">
      <div class="input-group-prepend">
        <span class="input-group-text" >標題</span>
      </div>
      <input type="text" class="form-control" aria-label="Default" aria-describedby="inputGroup-sizing-default" id="upload-result-title-${i}" readonly>
    </div>`)
        .css({ 'padding-left': '5%', 'padding-right': '5%' })
        .appendTo('#upload-result');

      $(`#upload-result-title-${i}`).val(article[i].title);

      $(`<div class="input-group mb-3">
    <div class="input-group-prepend">
      <span class="input-group-text" >作者</span>
    </div>
    <input type="text" class="form-control" aria-label="Default" aria-describedby="inputGroup-sizing-default" id="upload-result-author-${i}" readonly>
  </div>`)
        .css({ 'padding-left': '5%', 'padding-right': '5%' })
        .appendTo('#upload-result');

      $(`#upload-result-author-${i}`).val(article[i].author);

      $(`<div class="input-group mb-3">
  <div class="input-group-prepend">
    <span class="input-group-text" >相似度</span>
  </div>
  <input type="text" class="form-control" aria-label="Default" aria-describedby="inputGroup-sizing-default" id="upload-result-similartiy-${i}" readonly>
</div>`)
        .css({ 'padding-left': '5%', 'padding-right': '5%' })
        .appendTo('#upload-result');

      $(`#upload-result-similartiy-${i}`).val(
        `${(similarity[i] * 100).toFixed(2)}%`
      );

      $('<button type="button">查看相似段落</button>')
        .attr('id', `check-similar-paragraph-${i}`)
        .css({ 'margin-left': '5%', 'margin-bottom': '3%' })
        .addClass('check-upload-similar-paragraph btn btn-secondary')
        .appendTo('#upload-result');
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

      $('<div></div>')
        .attr('id', 'article-source-content')
        .addClass('article-result border')
        .css({
          'margin-bottom': '20px',
          width: '35%',
          height: '500px',
          'overflow-y': 'scroll',
        })
        .appendTo('#article-result');
      $('#article-source-content').html($('#upload-article-content').val());

      $('<div></div>')
        .attr('id', 'article-target-content')
        .addClass('article-result border')
        .css({
          'margin-bottom': '20px',
          width: '35%',
          height: '500px',
          'overflow-y': 'scroll',
        })
        .appendTo('#article-result');
      $('#article-target-content').html(article[articleId].content);

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
  });

  $('#search').click(() => {
    $('#index').hide();
    $('#search-input-area').showFlex();
    $('#search-input-area').css('flex-direction', 'column');
    $('#search-input-area').css('align-items', 'center');
  });

  $('#search-go-back').click(() => {
    $('#index').show();
    $('#search-input-area').hide();
  });

  $('#search-submit').click(async () => {
    $('#search-input-area').hide();
    const response = await $.ajax({
      method: 'POST',
      url: '/api/1.0/article/search',
      data: {
        title: $('#search-title').val(),
        author: $('#search-author').val(),
        content: $('#search-content').val(),
      },
      dataType: 'json',
      crossDomain: true,
    });
    console.log(response);
    const articles = response.hits.hits;
    articles.forEach((element) => {
      $(`<div>標題：${element._source.title}</div>`).appendTo('#search-result');
      $(`<div>作者：${element._source.author}</div>`).appendTo(
        '#search-result'
      );
      $(`<div>內容：${element._source.content}</div>`).appendTo(
        '#search-result'
      );
    });
  });
});
