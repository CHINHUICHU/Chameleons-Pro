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

  $('#search-result-number').html(`<h5>共有${total}個搜尋結果</h5>`);

  article.forEach((element) => {
    $('<div class="shadow-sm p-3 mb-5 rounded search-area"></div>').appendTo(
      '#search-result'
    );
    $(
      `<h4 class="article-title"><a href="/article" id="${element.id}">${element.title}</a></h4>`
    ).appendTo('.search-area:last');

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
    console.log('hey~');
    await getArticles(1);

    const pageNumber = +localStorage.getItem('pageNumber');
    for (let i = 1; i <= Math.min(pageNumber, 5); i += 1) {
      $(`<a>${i}</a>`).attr('id', `page-${i}`).appendTo('.pagination-inner');
    }

    $('#page-1').addClass('pagination-active');
  }

  // if (
  //   +$('.pagination-active').attr('id').split('-')[1] ===
  //   +localStorage.getItem('pageNumber')
  // ) {
  //   console.log('yo');
  //   $('.pagination-newer').attr('disabled', true);
  // }
  // console.log($('#search-result').height());
  // if ($('#search-result').height() < 500) {
  //   $('footer').css({ position: 'sticky', bottom: '0', width: '100% auto' });
  // }
});

$(document).on('click', '.pagination-inner a', async function () {
  $(this).siblings().removeClass('pagination-active');
  $(this).addClass('pagination-active');
  const page = $(this).attr('id').split('-')[1];
  await getArticles(page);
  // $('.article-title a').click(function () {
  //   console.log('hey');
  //   console.log($(this).attr('id'));
  //   localStorage.setItem('articleId', $(this).attr('id'));
  //   localStorage.setItem('current-page', $('.pagination-active').attr('id'));
  // });
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
    // $('.pagination-inner a').click(async function () {
    //   $(this).siblings().removeClass('pagination-active');
    //   $(this).addClass('pagination-active');
    //   const page = $(this).attr('id').split('-')[1];
    //   await getArticles(page);
    // });
    // $('.article-title a').click(function () {
    //   console.log($(this).attr('id'));
    //   localStorage.setItem('articleId', $(this).attr('id'));
    //   localStorage.setItem('current-page', $('.pagination-active').attr('id'));
    // });
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

$(document).on('click', '.article-title a', function () {
  localStorage.setItem('articleId', $(this).attr('id'));
  localStorage.setItem('current-page', $('.pagination-active').attr('id'));
  console.log($('.pagination-active').attr('id'));
});
