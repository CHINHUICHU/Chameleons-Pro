/* eslint-disable no-undef */
async function getRecords(page, header) {
  let response = await axios.get(`/api/1.0/articles/records?page=${page}`, {
    headers: header,
  });
  let { totalRecords } = response.data.data;
  localStorage.setItem('totalRecordPage', Math.ceil(totalRecords / 10));
  return response;
}

function displayRecords(records) {
  console.log(records);
  $('tbody').empty();
  for (let i = 0; i < records.length; i += 1) {
    const compareDate = Date(records[i].create_at).toLocaleString().split(' ');

    $(`<tr class="accordion-toggle collapsed" id="accordion-${i}" data-toggle="collapse" data-parent="#accordion-${i}" href="#collapse-${i}">
      <td class="expand-button"></td>
      <td>${compareDate[1]} ${compareDate[2]} ${compareDate[3]}</td>
      <td>${compareMap[records[i].compare_mode]}</td>
      <td>${compareStatus[records[i].status]}</td>
      <td>${
        (records[i].match_result.similarity * 100).toFixed(2) || '比對進行中'
      }%</td>
      </tr>

      <tr class="hide-table-padding">
      <td></td>
      <td colspan="3">
      <div id="collapse-${i}" class="collapse in p-3">
        <div class="row">
          <div class="col-6" id="source">
            <div class="input-group mb-3">
              <div class="input-group-prepend shadow-sm">
                <span class="input-group-text">標題</span>
              </div>
              <input type="text" class="form-control" id="source-title-${i}" aria-label="Default" aria-describedby="inputGroup-sizing-default" readonly>
            </div>
            <div class="input-group mb-3">
              <div class="input-group-prepend shadow-sm">
                <span class="input-group-text">作者</span>
              </div>
              <input type="text" class="form-control" id="source-author-${i}" aria-label="Default" aria-describedby="inputGroup-sizing-default" readonly>
            </div>
            <div id="source-content-${i}" class="border shadow-sm p-3 mb-5 bg-white rounded article-content"></div>
          </div>
            <div class="col-6" id="target">
              <div class="input-group mb-3">
                <div class="input-group-prepend shadow-sm">
                  <span class="input-group-text">標題</span>
                </div>
                <input type="text" class="form-control" id="target-title-${i}" aria-label="Default" aria-describedby="inputGroup-sizing-default" readonly>
              </div>
              <div class="input-group mb-3">
                <div class="input-group-prepend shadow-sm">
                  <span class="input-group-text">作者</span>
              </div>
              <input type="text" class="form-control" id="target-author-${i}" aria-label="Default" aria-describedby="inputGroup-sizing-default" readonly>
              </div>
            <div id="target-content-${i}" class="border shadow-sm p-3 mb-5 bg-white rounded article-content"></div>
            </div>
          </div>
      </div></td>
      </tr>`).appendTo('tbody');

    $(`#source-title-${i}`).val(records[i].source_article.title);
    $(`#target-title-${i}`).val(records[i].target_article.title);

    $(`#source-author-${i}`).val(records[i].source_article.author);
    $(`#target-author-${i}`).val(records[i].target_article.author);

    $(`#source-content-${i}`).html(records[i].source_article.content);

    $(`#target-content-${i}`).html(records[i].target_article.content);
  }
}

const compareMap = {
  1: '單篇比對',
  2: '多篇比對',
  3: '上傳比對',
};

const compareStatus = {
  0: '進行中',
  1: '已完成',
};

$(document).ready(async () => {
  const token = localStorage.getItem('jwt');
  const header = {
    'Content-Type': 'application/json',
    Authorization: token,
  };

  if (!$('tbody tr').length) {
    const response = await getRecords(1, header);

    const pageNumber = +localStorage.getItem('totalRecordPage');
    for (let i = 1; i <= Math.min(pageNumber, 5); i += 1) {
      $(`<a>${i}</a>`).attr('id', `page-${i}`).appendTo('.pagination-inner');
    }

    $('#page-1').addClass('pagination-active');
    const records = response.data.data.highestSimilaityResult;

    displayRecords(records);
  }
});

$(document).on('click', '.pagination-inner a', async function () {
  $(this).siblings().removeClass('pagination-active');
  $(this).addClass('pagination-active');
  const page = $(this).attr('id').split('-')[1];
  const response = await getRecords(page, {
    'Content-Type': 'application/json',
    Authorization: localStorage.getItem('jwt'),
  });
  const records = response.data.data.highestSimilaityResult;
  displayRecords(records);
});

$(document).on('click', '.pagination-older', async () => {
  const previousActive = +$('.pagination-active').attr('id').split('-')[1];

  if (previousActive > 1) {
    const response = await getRecords(previousActive - 1, {
      'Content-Type': 'application/json',
      Authorization: localStorage.getItem('jwt'),
    });
    const records = response.data.data.highestSimilaityResult;
    displayRecords(records);
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
  const pageNumber = +localStorage.getItem('totalRecordPage');
  if (previousActive < pageNumber) {
    const response = await getRecords(previousActive + 1, {
      'Content-Type': 'application/json',
      Authorization: localStorage.getItem('jwt'),
    });
    const records = response.data.data.highestSimilaityResult;
    displayRecords(records);
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
