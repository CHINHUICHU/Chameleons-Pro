/* eslint-disable no-undef */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-syntax */
$(document).ready(async () => {
  let comparedArticles = 2;
  $('#new-article').click(() => {
    comparedArticles += 1;
    if (comparedArticles > 2) {
      $('#remove-article').attr('disabled', false);
    }
    $('#multiple-compare-article-1')
      .clone()
      .attr('id', `multiple-compare-article-${comparedArticles}`)
      .css({ 'margin-top': '5%' })
      .insertBefore('#multiple-finish');
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

  $('#remove-article').click(function () {
    $(`#multiple-compare-article-${comparedArticles}`).remove();
    comparedArticles -= 1;
    if (comparedArticles === 2) {
      $(this).attr('disabled', true);
    }
  });

  let response;

  $('#multiple-submit').click(async () => {
    $('#multiple').hide();
    $('#multiple-finish').hide();

    const articles = [];
    for (let i = 1; i <= comparedArticles; i += 1) {
      if (
        validator.isEmpty($(`#article-${i}-title`).val()) ||
        validator.isEmpty($(`#article-${i}-author`).val()) ||
        validator.isEmpty($(`#article-${i}-content`).val())
      ) {
        Swal.fire({
          icon: 'error',
          text: '文章標題、作者與內文為必填資訊',
          showConfirmButton: false,
        });
        return;
      }
      if (
        !validator.isLength($(`#article-${i}-title`).val(), { min: 1, max: 50 })
      ) {
        Swal.fire({
          icon: 'error',
          text: '文章標題字數上限為50字',
          showConfirmButton: false,
        });
        return;
      }

      if (
        !validator.isLength($(`#article-${i}-author`).val(), {
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
        !validator.isLength($(`#article-${i}-content`).val(), {
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

      articles.push({
        title: $(`#article-${i}-title`)
          .val()
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;'),
        author: $(`#article-${i}-author`)
          .val()
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;'),
        content: $(`#article-${i}-content`)
          .val()
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;'),
      });
    }
    const token = localStorage.getItem('jwt');
    const header = {
      'Content-Type': 'application/json',
      Authorization: token,
    };

    response = await axios.post(
      '/api/1.0/articles/multiple',
      {
        data: articles,
      },
      { headers: header }
    );

    const edges = response.data.data.similarity.links;

    const edgeNumber = edges.length;

    for (let i = 0; i < edgeNumber; i += 1) {
      const sourceTitle = $(`#article-${+edges[i].source}-title`).val();
      const targetTitle = $(`#article-${+edges[i].target}-title`).val();

      $(`<div class="input-group mb-3">
        <div class="input-group-prepend shadow-sm">
          <span class="input-group-text" >來源</span>
        </div>
        <input type="text" class="form-control" aria-label="Default" aria-describedby="inputGroup-sizing-default" id="source-title-${i}" readonly>
        </div>`)
        .css({ 'padding-left': '5%', 'padding-right': '5%' })
        .appendTo('#multiple-result');

      $(`#source-title-${i}`).val(sourceTitle);

      $(`<div class="input-group mb-3">
      <div class="input-group-prepend shadow-sm">
        <span class="input-group-text" >比對</span>
      </div>
      <input type="text" class="form-control" aria-label="Default" 
      aria-describedby="inputGroup-sizing-default" 
      id="target-title-${i}" readonly>
      </div>`)
        .css({ 'padding-left': '5%', 'padding-right': '5%' })
        .appendTo('#multiple-result');

      $(`#target-title-${i}`).val(targetTitle);

      $(`<div class="input-group mb-3">
    <div class="input-group-prepend shadow-sm">
      <span class="input-group-text" >相似度</span>
    </div>
    <input type="text" class="form-control" aria-label="Default" 
    aria-describedby="inputGroup-sizing-default" 
    id="similartiy-${+edges[i].source}-and-${+edges[i].target}" readonly>
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

      $('<div class="shadow-sm p-3 mb-5 bg-white rounded"></div>')
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
        .attr('id', `article-${article1}-result`)
        .addClass('article-result border')
        .css({
          'margin-bottom': '20px',
          width: '35%',
          height: '500px',
          'overflow-y': 'scroll',
        })
        .appendTo('#article-result');

      const article1paragraphs = $(`#article-${article1}-content`)
        .val()
        .split('\n');
      const article2paragraphs = $(`#article-${article2}-content`)
        .val()
        .split('\n');

      let article1withParagraph = '';
      let article2withParagraph = '';
      for (const paragraph of article1paragraphs) {
        article1withParagraph += `<p>${paragraph}</p>`;
      }
      for (const paragraph of article2paragraphs) {
        article2withParagraph += `<p>${paragraph}</p>`;
      }
      $(`#article-${article1}-result`).html(article1withParagraph);

      $('<div class="shadow-sm p-3 mb-5 bg-white rounded"></div>')
        .attr('id', `article-${article2}-result`)
        .addClass('article-result border')
        .css({
          'margin-bottom': '20px',
          width: '35%',
          height: '500px',
          'overflow-y': 'scroll',
        })
        .appendTo('#article-result');
      $(`#article-${article2}-result`).html(article2withParagraph);

      // const article1split = $(`#article-${article1}-content`)
      //   .val()
      //   .split(/(?:，|。|\n|！|？|：|；)+/);
      // const article1splitLength = article1split.length;

      // console.log(article1split);

      // const article2split = $(`#article-${article2}-content`)
      //   .val()
      //   .split(/(?:，|。|\n|！|？|：|；)+/);
      // const article2splitLength = article2split.length;

      // console.log(article2split);

      const { matchResult } = response.data.data;
      for (const matchSentence of matchResult[$(this).attr('id')]) {
        $(`#article-${article1}-result`).mark(matchSentence.sourceSentence);
        $(`#article-${article2}-result`).mark(matchSentence.targetSentence);
      }

      // const similarSentenceIndex = JSON.parse(
      //   localStorage.getItem('sentence-index')
      // )[`${$(this).attr('id')}`];

      // for (let i = 0; i < article1splitLength; i += 1) {
      //   if (similarSentenceIndex[0][i]) {
      //     $(`#article-${article1}-result`).mark(article1split[i]);
      //   }
      // }

      // for (let i = 0; i < article2splitLength; i += 1) {
      //   if (similarSentenceIndex[1][i]) {
      //     $(`#article-${article2}-result`).mark(article2split[i]);
      //   }
      // }
    });
  });

  $('#signup-signin-link').click(() => {
    localStorage.setItem('previous-page', window.location.href);
  });
});
