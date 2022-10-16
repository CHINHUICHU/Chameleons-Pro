/* eslint-disable no-undef */
function showSimilarArticleNumber(articleNumber) {
  $(`<h2>該文章共與${articleNumber}篇文章相似度超過10%</h2>`)
    .css({ 'padding-left': '5%', 'margin-bottom': '5%' })
    .appendTo('#upload-result');
}

function displayTitle(title, index) {
  $(`<div class="input-group mb-3">
  <div class="input-group-prepend shadow-sm">
    <span class="input-group-text">標題</span>
  </div>
  <input type="text" class="form-control" aria-label="Default" 
  aria-describedby="inputGroup-sizing-default" id="upload-result-title-${index}" readonly>
</div>`)
    .css({ 'padding-left': '5%', 'padding-right': '5%' })
    .appendTo('.upload-result-area:last');

  $(`#upload-result-title-${index}`).val(title);
}

function displayAuthor(author, index) {
  $(`<div class="input-group mb-3">
  <div class="input-group-prepend shadow-sm">
    <span class="input-group-text">作者</span>
  </div>
  <input type="text" class="form-control" aria-label="Default" 
  aria-describedby="inputGroup-sizing-default" id="upload-result-author-${index}" readonly>
</div>`)
    .css({ 'padding-left': '5%', 'padding-right': '5%' })
    .appendTo('.upload-result-area:last');

  $(`#upload-result-author-${index}`).val(author);
}

function displaySimilarity(similarity, index) {
  $(`<div class="input-group mb-3">
  <div class="input-group-prepend shadow-sm">
    <span class="input-group-text">相似度</span>
  </div>
  <input type="text" class="form-control" aria-label="Default" 
  aria-describedby="inputGroup-sizing-default" id="upload-result-similartiy-${index}" readonly>
  </div>`)
    .css({ 'padding-left': '5%', 'padding-right': '5%' })
    .appendTo('.upload-result-area:last');

  $(`#upload-result-similartiy-${index}`).val(
    `${(similarity * 100).toFixed(2)}%`
  );
}

function displayCheckResultBtn(index) {
  $('<button type="button">查看相似段落</button>')
    .attr('id', `check-similar-paragraph-${index}`)
    .css({ 'margin-left': '5%', 'margin-bottom': '3%' })
    .addClass('check-upload-similar-paragraph btn btn-secondary')
    .appendTo('.upload-result-area:last');
}

function prepareDisplayResult(kind) {
  $('<div class="shadow-sm p-3 mb-5 bg-white rounded"></div>')
    .attr('id', `article-${kind}-content`)
    .addClass('article-result border')
    .css({
      'margin-bottom': '20px',
      width: '45%',
      height: '500px',
      'overflow-y': 'scroll',
    })
    .appendTo('#article-result');
}

let response;

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

    if (!validator.isLength($('#upload-article-title').val(), { max: 50 })) {
      Swal.fire({
        icon: 'error',
        text: '文章標題字數上限為50字',
        showConfirmButton: false,
      });
      return;
    }

    if (
      !validator.isLength($('#upload-article-author').val(), {
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
        max: 10000,
      })
    ) {
      Swal.fire({
        icon: 'error',
        text: '文章字數上限為一萬字',
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
      response = await axios.post(
        '/api/1.0/articles/analysis',
        {
          data: uploadArticle,
        },
        { headers: header }
      );

      if (response.data.data) {
        const { article, similarity } = response.data.data;

        showSimilarArticleNumber(article.length);

        for (let i = 0; i < article.length; i += 1) {
          $('<div class="upload-result-area"></div>').appendTo(
            '#upload-result'
          );

          displayTitle(article[i].title, i);
          displayAuthor(article[i].author, i);
          displaySimilarity(similarity[i], i);
          displayCheckResultBtn(i);
        }
      } else {
        Swal.fire({
          icon: 'success',
          text: response.data.message,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.log(error);
      Swal.fire({
        icon: 'error',
        text: error.response.data.message,
        showConfirmButton: false,
      });
    }
  });
});

$(document).on('click', '.check-upload-similar-paragraph', function (e) {
  e.stopPropagation();
  $('#article-result').remove();
  const articleId = $(this).attr('id').split('-')[3];

  const { article } = response.data.data;

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

  prepareDisplayResult('source');

  prepareDisplayResult('target');

  const { matchResult } = response.data.data;

  const sourceContentSplit = $('#upload-article-content')
    .val()
    .split(/(?=，|。|！|？|：|；)+/);

  const targetContentSplit =
    article[articleId].content.split(/(?=，|。|！|？|：|；)+/);

  let sourceMarkIndex = matchResult[articleId].map(
    (element) => element.sourceSentence
  );

  sourceMarkIndex = Array.from(new Set([...sourceMarkIndex])).sort();

  let targetMarkIndex = matchResult[articleId].map(
    (element) => element.targetSentence
  );

  targetMarkIndex = Array.from(new Set([...targetMarkIndex])).sort();

  for (let index of sourceMarkIndex) {
    sourceContentSplit[index] = `<mark>${sourceContentSplit[index]}</mark>`;
  }
  for (let index of targetMarkIndex) {
    targetContentSplit[index] = `<mark>${targetContentSplit[index]}</mark>`;
  }

  let sourceMarkedContent = '';
  for (let sentence of sourceContentSplit) {
    sourceMarkedContent += sentence;
  }
  let targetMarkedContent = '';
  for (let sentence of targetContentSplit) {
    targetMarkedContent += sentence;
  }

  $('#article-source-content').html(sourceMarkedContent);

  $('#article-target-content').html(targetMarkedContent);
});
