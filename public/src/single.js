/* eslint-disable no-undef */

$.fn.showFlex = function () {
  this.show();
  this.css('display', 'flex');
  this.css('justify-content', 'space-around');
};

function prepareDisplayResult() {
  $('#top').showFlex();
  $('#nav').hide();
  $('#main').hide();
  $('#finish').hide();
  $('#result').showFlex();
  $('#main-result').showFlex();
}

function displaySimilarity(similarity) {
  $('#similarity').html(`相似度：${(similarity * 100).toFixed(2)}%`);
}

function preprocessArticleContent(sourceArticleContent, targetArticleContent) {
  let sourceArticleWithParagraph = '';
  let targetArticleWithParagraph = '';
  for (const paragraph of sourceArticleContent) {
    sourceArticleWithParagraph += `<p>${paragraph}</p>`;
  }
  for (const paragraph of targetArticleContent) {
    targetArticleWithParagraph += `<p>${paragraph}</p>`;
  }
  return [sourceArticleWithParagraph, targetArticleWithParagraph];
}

function displayArticleInfo(title, author, content, kind) {
  $(`#result-${kind}-title`).val(title);
  $(`#result-${kind}-author`).val(author);
  $(`#result-${kind}-content`).html(content);
}

function markArticle(matchResult) {
  for (const matchSentence of matchResult) {
    $('#result-source-content').mark(matchSentence.sourceSentence);
    $('#result-target-content').mark(matchSentence.targetSentence);
  }
}

$(document).ready(async () => {
  if (localStorage.getItem('single-result')) {
    const { source, target, compareResult, similarity } = JSON.parse(
      localStorage.getItem('single-result')
    );

    prepareDisplayResult();

    displaySimilarity(similarity);

    const [sourceArticleWithParagraph, targetArticleWithParagraph] =
      preprocessArticleContent(
        source.content.split('\n'),
        target.content.split('\n')
      );

    displayArticleInfo(
      source.title,
      source.author,
      sourceArticleWithParagraph,
      'source'
    );
    displayArticleInfo(
      target.title,
      target.author,
      targetArticleWithParagraph,
      'target'
    );

    markArticle(compareResult);

    localStorage.removeItem('single-result');
  }

  $('#article-search').change(() => {
    localStorage.setItem('search', $('#article-search').val());
    window.location.href = '/search';
  });

  $('#finish>button').click(async () => {
    if (
      validator.isEmpty($('#article-source-title').val()) ||
      validator.isEmpty($('#article-source-author').val()) ||
      validator.isEmpty($('#article-source-content').val()) ||
      validator.isEmpty($('#article-target-title').val()) ||
      validator.isEmpty($('#article-target-author').val()) ||
      validator.isEmpty($('#article-target-content').val())
    ) {
      Swal.fire({
        icon: 'error',
        text: '文章標題、作者與內文為必填資訊',
        showConfirmButton: false,
      });
      return;
    }

    if (
      !validator.isLength($('#article-source-title').val(), {
        max: 50,
      }) ||
      !validator.isLength($('#article-target-title').val(), { min: 1, max: 50 })
    ) {
      Swal.fire({
        icon: 'error',
        text: '文章標題字數上限為50字',
        showConfirmButton: false,
      });
      return;
    }

    if (
      !validator.isLength($('#article-source-author').val(), {
        max: 20,
      }) ||
      !validator.isLength($('#article-target-author').val(), {
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
      !validator.isLength($('#article-source-content').val(), {
        min: 1,
        max: 100000,
      }) ||
      !validator.isLength($('#article-target-content').val(), {
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

    try {
      const response = await axios.post(
        '/api/1.0/articles/single',
        {
          data: {
            sourceArticle: {
              title: $('#article-source-title')
                .val()
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;'),
              author: $('#article-source-author')
                .val()
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;'),
              content: $('#article-source-content')
                .val()
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;'),
            },
            targetArticle: {
              title: $('#article-target-title')
                .val()
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;'),
              author: $('#article-target-author')
                .val()
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;'),
              content: $('#article-target-content')
                .val()
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;'),
            },
          },
        },
        { headers: header }
      );

      if (response.data.data) {
        prepareDisplayResult();

        const { matchResult, similarity } = response.data.data;

        displaySimilarity(similarity);

        const [sourceArticleWithParagraph, targetArticleWithParagraph] =
          preprocessArticleContent(
            $('#article-source-content').val().split('\n'),
            $('#article-target-content').val().split('\n')
          );

        displayArticleInfo(
          $('#article-source-title').val(),
          $('#article-source-author').val(),
          sourceArticleWithParagraph,
          'source'
        );
        displayArticleInfo(
          $('#article-target-title').val(),
          $('#article-target-author').val(),
          targetArticleWithParagraph,
          'target'
        );

        markArticle(matchResult);
      } else {
        Swal.fire({
          icon: 'success',
          text: response.data.message,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        text: error.response.data.message,
        showConfirmButton: false,
      });
    }
  });
});
