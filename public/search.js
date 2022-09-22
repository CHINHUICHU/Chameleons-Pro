/* eslint-disable no-restricted-syntax */
$(document).ready(async () => {
  async function getArticles(page) {
    const response = await axios.get(
      `/api/1.0/articles/search?page=${page}&key=${localStorage.getItem(
        'search'
      )}`
    );
    $('#search-result').empty();
    $('#search-result-number').empty();
    const { article, total } = response.data.data;

    localStorage.setItem('pageNumber', total);

    $('#search-result-number')
      .html(`<h2>共有${total}個搜尋結果</h2>`)
      .css({ 'margin-bottom': '3%' });

    article.forEach((element) => {
      $(
        `<h4 class="article-title"><a href="/article" id="${element.id}">${element.title}</a></h4>`
      ).appendTo('#search-result');
      $(`<div>${element.content}</div>`)
        .addClass('text-truncate')
        .css({ 'margin-bottom': '3%' })
        .appendTo('#search-result');
    });
  }

  if (!$('#search-result').find('div').length) {
    await getArticles(1);

    const pageNumber = Math.ceil(localStorage.getItem('pageNumber') / 10);
    for (let i = 1; i <= Math.min(pageNumber, 5); i += 1) {
      $(`<a>${i}</a>`).attr('id', `page-${i}`).appendTo('.pagination-inner');
    }

    $('#page-1').addClass('pagination-active');
    console.log($('.pagination-inner'));
  }

  $('.pagination-inner a').click(async function () {
    console.log('hey');
    $(this).siblings().removeClass('pagination-active');
    $(this).addClass('pagination-active');
    const page = $(this).attr('id').split('-')[1];
    await getArticles(page);
  });

  $('.pagination-older').click(async () => {
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
          $(`<a>${i}</a>`)
            .attr('id', `page-${i}`)
            .appendTo('.pagination-inner');
        }
      }
      $(`#page-${previousActive - 1}`).addClass('pagination-active');
      $('.pagination-inner a').click(async function () {
        console.log('hey');
        $(this).siblings().removeClass('pagination-active');
        $(this).addClass('pagination-active');
        const page = $(this).attr('id').split('-')[1];
        await getArticles(page);
      });
    }
  });

  $('.pagination-newer').click(async () => {
    const previousActive = +$('.pagination-active').attr('id').split('-')[1];
    await getArticles(previousActive + 1);
    const pageNumber = localStorage.getItem('pageNumber');
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

      $('.pagination-inner a').click(async function () {
        console.log('hey');
        $(this).siblings().removeClass('pagination-active');
        $(this).addClass('pagination-active');
        const page = $(this).attr('id').split('-')[1];
        await getArticles(page);
      });
    }
  });

  $('.article-title a').click(function () {
    localStorage.setItem('articleId', $(this).attr('id'));
  });
});
