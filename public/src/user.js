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
    const compareDate = Date(records[i]._source.create_time)
      .toLocaleString()
      .split(' ');

    $('<tr></tr>')
      .attr('id', `record-${i + 1}`)
      .appendTo('tbody');
    $(`
    <th scope="row">${i + 1}</th>
    <td>${compareDate[1]} ${compareDate[2]} ${compareDate[3]}</td>
    <td>${compareMap[records[i]._source.compare_mode]}</td>`).appendTo(
      `#record-${i + 1}`
    );

    $(`#record-${i + 1}-similar-articles`).css({
      width: '80%',
    });

    if (+$(`#record-${i + 1}-similar-articles`).html() === 0) {
      $(`#record-${i + 1}-similar-articles`).addClass('btn btn-success');
    } else if (+$(`#record-${i + 1}-similar-articles`).html() <= 3) {
      $(`#record-${i + 1}-similar-articles`).addClass('btn btn-warning');
    } else {
      $(`#record-${i + 1}-similar-articles`).addClass('btn btn-danger');
    }

    if (+$(`#record-${i + 1}-highest-similarity`).html() === 0) {
      $(`#record-${i + 1}-similar-articles`).addClass('btn btn-success');
    } else if (+$(`#record-${i + 1}-highest-similarity`).html() <= 30) {
      $(`#record-${i + 1}-similar-articles`).addClass('btn btn-warning');
    } else {
      $(`#record-${i + 1}-highest-similarity`).addClass('btn btn-danger');
    }
  }
});
