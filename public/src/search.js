/* eslint-disable no-undef */
/* eslint-disable no-restricted-syntax */
async function getArticles(page) {
  const response = await axios.get(
    `/api/1.0/articles/search?page=${page}&key=${localStorage.getItem(
      'search'
    )}`
  );
  $('#search-result').empty();
  $('#search-result-number').empty();
  const { article, total } = response.data.data;

  localStorage.setItem('pageNumber', Math.ceil(total / 10));

  $('#search-result-number').html(
    `<h5>搜尋關鍵字：${localStorage.getItem(
      'search'
    )}      共有${total}個搜尋結果</h5>`
  );

  if (total === 0) {
    $('.pagination-container').hide();
    $('<div id="retype">請重新輸入搜尋關鍵字</div>')
      .css({})
      .appendTo('#search-result');
    $('<img src="./images/chameleons.gif">').appendTo('#search-result');
  }

  article.forEach((element) => {
    $(
      `<a href="/article" id="${element.id}"><div class="shadow-sm p-3 mb-5 rounded search-area"></div></a>`
    ).appendTo('#search-result');
    $(`<h4 class="article-title">${element.title}</h4>`).appendTo(
      '.search-area:last'
    );

    $(`<div>${element.content}</div>`)
      .addClass('crop-text-3')
      .css({ 'margin-bottom': '3%' })
      .appendTo('.search-area:last');
  });
}

$(document).ready(async () => {
  if (localStorage.getItem('current-page')) {
    console.log(localStorage.getItem('current-page'));
    const currentPage = +localStorage.getItem('current-page').split('-')[1];
    const pageNumber = +localStorage.getItem('pageNumber');
    await getArticles(currentPage);

    for (
      let i = Math.floor(currentPage / 5) * 5 + 1;
      i <= Math.min(pageNumber, Math.floor(currentPage / 5) * 5 + 5);
      i += 1
    ) {
      $(`<a>${i}</a>`).attr('id', `page-${i}`).appendTo('.pagination-inner');
    }
    $('.pagination-inner a').siblings().removeClass('pagination-active');
    $(`#${localStorage.getItem('current-page')}`).addClass('pagination-active');
  }

  if (!$('#search-result').find('div').length) {
    await getArticles(1);

    const pageNumber = +localStorage.getItem('pageNumber');
    for (let i = 1; i <= Math.min(pageNumber, 5); i += 1) {
      $(`<a>${i}</a>`).attr('id', `page-${i}`).appendTo('.pagination-inner');
    }

    $('#page-1').addClass('pagination-active');
  }
});

$(document).on('click', '.pagination-inner a', async function () {
  $(this).siblings().removeClass('pagination-active');
  $(this).addClass('pagination-active');
  const page = $(this).attr('id').split('-')[1];
  await getArticles(page);
});

$(document).on('click', '.pagination-older', async () => {
  const previousActive = +$('.pagination-active').attr('id').split('-')[1];
  await getArticles(previousActive - 1);
  if (previousActive > 1) {
    $(`#page-${previousActive}`).removeClass('pagination-active');
    if (previousActive % 5 === 1) {
      $('.pagination-inner').empty();
      for (
        let i = Math.max(1, previousActive - 5);
        i <= previousActive - 1;
        i += 1
      ) {
        $(`<a>${i}</a>`).attr('id', `page-${i}`).appendTo('.pagination-inner');
      }
    }
    $(`#page-${previousActive - 1}`).addClass('pagination-active');
  }
});

$(document).on('click', '.pagination-newer', async () => {
  const previousActive = +$('.pagination-active').attr('id').split('-')[1];
  const pageNumber = +localStorage.getItem('pageNumber');
  if (previousActive < pageNumber) {
    await getArticles(previousActive + 1);
    if (previousActive % 5 !== 0) {
      $(`#page-${previousActive + 1}`).addClass('pagination-active');
      $(`#page-${previousActive}`).removeClass('pagination-active');
    } else {
      $('.pagination-inner').empty();
      for (
        let i = previousActive + 1;
        i <= Math.min(pageNumber, previousActive + 5);
        i += 1
      ) {
        $(`<a>${i}</a>`).attr('id', `page-${i}`).appendTo('.pagination-inner');
      }
      $(`#page-${previousActive + 1}`).addClass('pagination-active');
    }
  }
});

$(document).on('click', '#search-result a', function () {
  localStorage.setItem('articleId', $(this).attr('id'));
  localStorage.setItem('current-page', $('.pagination-active').attr('id'));
});
