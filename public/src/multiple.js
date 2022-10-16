/* eslint-disable no-undef */
function displayTitles(sourceTitle, targetTitle, compareIndex) {
  $(`<div class="input-group mb-3">
          <div class="input-group-prepend shadow-sm">
            <span class="input-group-text" >來源</span>
          </div>
          <input type="text" class="form-control" aria-label="Default" 
          aria-describedby="inputGroup-sizing-default" id="source-title-${compareIndex}" readonly>
          </div>`)
    .css({ 'padding-left': '5%', 'padding-right': '5%' })
    .appendTo('#multiple-result');

  $(`#source-title-${compareIndex}`).val(sourceTitle);

  $(`<div class="input-group mb-3">
        <div class="input-group-prepend shadow-sm">
          <span class="input-group-text" >比對</span>
        </div>
        <input type="text" class="form-control" aria-label="Default"
        aria-describedby="inputGroup-sizing-default"
        id="target-title-${compareIndex}" readonly>
        </div>`)
    .css({ 'padding-left': '5%', 'padding-right': '5%' })
    .appendTo('#multiple-result');

  $(`#target-title-${compareIndex}`).val(targetTitle);
}

function displaySimilarity(edges, compareIndex) {
  $(`<div class="input-group mb-3">
  <div class="input-group-prepend shadow-sm">
    <span class="input-group-text" >相似度</span>
  </div>
  <input type="text" class="form-control" aria-label="Default"
  aria-describedby="inputGroup-sizing-default"
  id="similartiy-${+edges[compareIndex].source}-and-${+edges[compareIndex]
    .target}" readonly>
</div>`)
    .css({ 'padding-left': '5%', 'padding-right': '5%' })
    .appendTo('#multiple-result');

  $(
    `#similartiy-${+edges[compareIndex].source}-and-${+edges[compareIndex]
      .target}`
  ).val(`${(+edges[compareIndex].weight * 100).toFixed(2)}%`);
}

function displayCheckButton(edges, compareIndex) {
  $('<button type="button">查看相似段落</button>')
    .attr(
      'id',
      `${+edges[compareIndex].source}-and-${+edges[compareIndex].target}`
    )
    .css({ 'margin-left': '5%', 'margin-bottom': '3%' })
    .addClass('check-similar-paragraph btn btn-secondary')
    .appendTo('#multiple-result');
}

function showArticle(articleId) {
  $('<div class="shadow-sm p-3 mb-5 bg-white rounded"></div>')
    .attr('id', `article-${articleId}-result`)
    .addClass('article-result border')
    .css({
      'margin-bottom': '20px',
      width: '35%',
      height: '500px',
      'overflow-y': 'scroll',
    })
    .appendTo('#article-result');
}

function preprocessArticle(sourceParagraphs, targetParagraphs) {
  let processedSource = '';
  let processedTarget = '';
  for (const paragraph of sourceParagraphs) {
    processedSource += `<p>${paragraph}</p>`;
  }
  for (const paragraph of targetParagraphs) {
    processedTarget += `<p>${paragraph}</p>`;
  }

  return [processedSource, processedTarget];
}

function markArticle(matchResult, source, target) {
  for (const matchSentence of matchResult) {
    $(`#article-${source}-result`).mark(matchSentence.sourceSentence);
    $(`#article-${target}-result`).mark(matchSentence.targetSentence);
  }
}

let response;

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

    if (response.data.data) {
      const edges = response.data.data.similarity.links;

      for (let i = 0; i < edges.length; i += 1) {
        const sourceTitle = $(`#article-${+edges[i].source}-title`).val();
        const targetTitle = $(`#article-${+edges[i].target}-title`).val();

        displayTitles(sourceTitle, targetTitle, i);
        displaySimilarity(edges, i);
        displayCheckButton(edges, i);
      }
    } else {
      Swal.fire({
        icon: 'success',
        text: response.data.message,
        showConfirmButton: false,
      });
    }
  });

  $('#signup-signin-link').click(() => {
    localStorage.setItem('previous-page', window.location.href);
  });
});

$(document).on('click', '.check-similar-paragraph', function (e) {
  e.stopPropagation();
  $('#article-result').remove();
  const articleIds = $(this).attr('id').split('-');
  const [source, target] = [articleIds[0], articleIds[2]];
  $('<div class=" p-3 mb-5 bg-white rounded"></div>')
    .attr('id', 'article-result')
    .css({
      display: 'flex',
      'justify-content': 'space-around',
      'padding-left': '5%',
      'padding-right': '5%',
      'margin-top': '3%',
    })
    .insertAfter($(this));

  showArticle(source);
  showArticle(target);

  const [processedSource, processedTarget] = preprocessArticle(
    $(`#article-${source}-content`).val().split('\n'),
    $(`#article-${target}-content`).val().split('\n')
  );

  $(`#article-${source}-result`).html(processedSource);
  $(`#article-${target}-result`).html(processedTarget);

  const { matchResult } = response.data.data;

  markArticle(matchResult[$(this).attr('id')].sentences, source, target);
});
