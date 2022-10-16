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
  $('tbody').empty();
  for (let i = 0; i < records.length; i += 1) {
    const compareDate = Date(records[i].create_time)
      .toLocaleString()
      .split(' ');

    $(`<tr class="accordion-toggle collapsed" id="accordion-${i}" data-toggle="collapse" data-parent="#accordion-${i}" href="#collapse-${i}">
      <td class="expand-button"></td>
      <td>${compareDate[1]} ${compareDate[2]} ${compareDate[3]}</td>
      <td>${compareMap[records[i].compare_mode]}</td>
      <td>${(records[i].match_result.similarity * 100).toFixed(2)}%</td>
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

    // const sourceArticleParagraphs =
    //   records[i].source_article.content.split('\n');
    // const targetArticleParagraphs =
    //   records[i].target_article.content.split('\n');

    // let sourceWithParagraphTag = '';
    // let targetWithParagraphTag = '';
    // for (const paragraph of sourceArticleParagraphs) {
    //   sourceWithParagraphTag += `<p>${paragraph}</p>`;
    // }
    // for (const paragraph of targetArticleParagraphs) {
    //   targetWithParagraphTag += `<p>${paragraph}</p>`;
    // }

    const matchResult = records[i].match_result.sentences;

    // console.log(matchResult);

    const sourceContentSplit =
      records[i].source_article.content.split(/(?=，|。|\n|！|？|：|；)+/);
    const targetContentSplit =
      records[i].target_article.content.split(/(?=，|。|\n|！|？|：|；)+/);

    let sourceMarkIndex = matchResult.map((element) => element.sourceSentence);

    sourceMarkIndex = Array.from(new Set([...sourceMarkIndex])).sort();

    let targetMarkIndex = matchResult.map((element) => element.targetSentence);

    targetMarkIndex = Array.from(new Set([...targetMarkIndex])).sort();

    console.log('sourceMarkIndex', sourceMarkIndex);

    console.log('targetMarkIndex', targetMarkIndex);

    let sourceMarkedContent = '';
    for (let i = 0; i < sourceContentSplit.length; i++) {
      let mark = sourceMarkIndex.shift();
      if (i === mark) {
        sourceContentSplit[i] = `<mark>${sourceContentSplit[i]}<mark>`;
      }
      sourceMarkedContent += sourceContentSplit[i];
    }

    let targetMarkedContent = '';
    for (let i = 0; i < targetContentSplit.length; i++) {
      let mark = targetMarkIndex.shift();
      if (i === mark) {
        targetContentSplit[i] = `<mark>${targetContentSplit[i]}<mark>`;
      }
      targetMarkedContent += targetContentSplit[i];
    }

    $(`#source-content-${i}`).html(sourceMarkedContent);

    $(`#target-content-${i}`).html(targetMarkedContent);

    // for (const matchSentence of matchResult.sentences) {
    //   $(`#source-content-${i}`).mark(sourceSplit[matchSentence.sourceSentence]);
    //   $(`#target-content-${i}`).mark(targetSplit[matchSentence.targetSentence]);
    // }
  }
}

// let response;

const compareMap = {
  1: '單篇比對',
  2: '多篇比對',
  3: '上傳比對',
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

  // console.log(response);
  // for (let i = 0; i < records.length; i += 1) {
  //   const compareDate = Date(records[i].create_time)
  //     .toLocaleString()
  //     .split(' ');

  //   $(`<tr class="accordion-toggle collapsed" id="accordion-${i}" data-toggle="collapse" data-parent="#accordion-${i}" href="#collapse-${i}">
  //     <td class="expand-button"></td>
  //     <td>${compareDate[1]} ${compareDate[2]} ${compareDate[3]}</td>
  //     <td>${compareMap[records[i].compare_mode]}</td>
  //     <td>${(records[i].match_result.similarity * 100).toFixed(2)}%</td>
  //     </tr>

  //     <tr class="hide-table-padding">
  //     <td></td>
  //     <td colspan="3">
  //     <div id="collapse-${i}" class="collapse in p-3">
  //       <div class="row">
  //         <div class="col-6" id="source">
  //           <div class="input-group mb-3">
  //             <div class="input-group-prepend shadow-sm">
  //               <span class="input-group-text">標題</span>
  //             </div>
  //             <input type="text" class="form-control" id="source-title-${i}" aria-label="Default" aria-describedby="inputGroup-sizing-default" readonly>
  //           </div>
  //           <div class="input-group mb-3">
  //             <div class="input-group-prepend shadow-sm">
  //               <span class="input-group-text">作者</span>
  //             </div>
  //             <input type="text" class="form-control" id="source-author-${i}" aria-label="Default" aria-describedby="inputGroup-sizing-default" readonly>
  //           </div>
  //           <div id="source-content-${i}" class="border shadow-sm p-3 mb-5 bg-white rounded article-content"></div>
  //         </div>
  //           <div class="col-6" id="target">
  //             <div class="input-group mb-3">
  //               <div class="input-group-prepend shadow-sm">
  //                 <span class="input-group-text">標題</span>
  //               </div>
  //               <input type="text" class="form-control" id="target-title-${i}" aria-label="Default" aria-describedby="inputGroup-sizing-default" readonly>
  //             </div>
  //             <div class="input-group mb-3">
  //               <div class="input-group-prepend shadow-sm">
  //                 <span class="input-group-text">作者</span>
  //             </div>
  //             <input type="text" class="form-control" id="target-author-${i}" aria-label="Default" aria-describedby="inputGroup-sizing-default" readonly>
  //             </div>
  //           <div id="target-content-${i}" class="border shadow-sm p-3 mb-5 bg-white rounded article-content"></div>
  //           </div>
  //         </div>
  //     </div></td>
  //     </tr>`).appendTo('tbody');

  //   $(`#source-title-${i}`).val(records[i].source_article.title);
  //   $(`#target-title-${i}`).val(records[i].target_article.title);

  //   $(`#source-author-${i}`).val(records[i].source_article.author);
  //   $(`#target-author-${i}`).val(records[i].target_article.author);

  //   const sourceArticleParagraphs =
  //     records[i].source_article.content.split('\n');
  //   const targetArticleParagraphs =
  //     records[i].target_article.content.split('\n');

  //   let sourceWithParagraphTag = '';
  //   let targetWithParagraphTag = '';
  //   for (const paragraph of sourceArticleParagraphs) {
  //     sourceWithParagraphTag += `<p>${paragraph}</p>`;
  //   }
  //   for (const paragraph of targetArticleParagraphs) {
  //     targetWithParagraphTag += `<p>${paragraph}</p>`;
  //   }
  //   $(`#source-content-${i}`).html(sourceWithParagraphTag);

  //   $(`#target-content-${i}`).html(targetWithParagraphTag);

  //   const matchResult = records[i].match_result;

  //   for (const matchSentence of matchResult.sentences) {
  //     $(`#source-content-${i}`).mark(matchSentence.sourceSentence);
  //     $(`#target-content-${i}`).mark(matchSentence.targetSentence);
  //   }
  // }
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
