/* eslint-disable no-restricted-syntax */
/* eslint-disable no-undef */
$(document).ready(async () => {
  const token = localStorage.getItem('jwt');
  const header = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.get('/api/1.0/articles/records', {
    headers: header,
  });
  const compareMap = {
    1: '單篇比對',
    2: '多篇比對',
    3: '上傳比對',
  };
  console.log(response);
  const records = response.data.data;
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

    const sourceArticleParagraphs =
      records[i].source_article.content.split('\n');
    const targetArticleParagraphs =
      records[i].target_article.content.split('\n');

    let sourceWithParagraphTag = '';
    let targetWithParagraphTag = '';
    for (const paragraph of sourceArticleParagraphs) {
      sourceWithParagraphTag += `<p>${paragraph}</p>`;
    }
    for (const paragraph of targetArticleParagraphs) {
      targetWithParagraphTag += `<p>${paragraph}</p>`;
    }
    $(`#source-content-${i}`).html(sourceWithParagraphTag);

    $(`#target-content-${i}`).html(targetWithParagraphTag);

    const matchResult = records[i].match_result;
    for (const matchSentence of matchResult.sentences) {
      $(`#source-content-${i}`).mark(matchSentence.sourceSentence);
      $(`#target-content-${i}`).mark(matchSentence.targetSentence);
    }
  }
});
