/* eslint-disable no-restricted-syntax */
/* eslint-disable no-undef */
$(document).ready(() => {
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
    $.fn.showFlex = function () {
      this.css('display', 'flex');
      this.css('justify-content', 'space-around');
    };
    $('#result').showFlex();

    $('#similarity').html(response.data.similarity);
    $('#result-A').html($('#article-A').val());
    $('#result-B').html($('#article-B').val());

    const { articleA, articleB } = response.data;

    articleA.forEach((element) => {
      const start = Math.min(...element);
      const end = Math.max(...element);
      if (start >= 0) {
        $('#result-A').markRanges([
          {
            start,
            length: end - start,
          },
        ]);
      }
    });

    articleB.forEach((element) => {
      const start = Math.min(...element);
      const end = Math.max(...element);
      if (start >= 0) {
        $('#result-B').markRanges([
          {
            start,
            length: end - start,
          },
        ]);
      }
    });
  });
});
