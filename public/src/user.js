$(document).ready(async () => {
  const token = localStorage.getItem('jwt');
  const header = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.get('/api/1.0/articles/records', {
    headers: header,
  });
  const records = response.data.data;
  for (let i = 0; i < records.length; i += 1) {
    $('<tr></tr>')
      .attr('id', `record-${i + 1}`)
      .appendTo('tbody');
    $(`
    <th scope="row">${i + 1}</th>
    <td>${records[i].title}</td>
    <td>${records[i].author}</td>
    <td><button type="button" id="record-${i + 1}-similar-articles">${
      records[i].similar_articles
    }</button></td>
    <td><button type="button" id="record-${i + 1}-highest-similarity">${(
      records[i].highest_similarity * 100
    ).toFixed(2)}%</button></td>`).appendTo(`#record-${i + 1}`);

    $(`#record-${i + 1}-similar-articles`).css({
      width: '80%',
    });

    if (+$(`#record-${i + 1}-similar-articles`).html() === 0) {
      $(`#record-${i + 1}-similar-articles`).addClass(
        'btn btn-outline-success'
      );
    } else if (+$(`#record-${i + 1}-similar-articles`).html() <= 3) {
      $(`#record-${i + 1}-similar-articles`).addClass(
        'btn btn-outline-warning'
      );
    } else {
      $(`#record-${i + 1}-similar-articles`).addClass('btn btn-outline-danger');
    }

    if (+$(`#record-${i + 1}-highest-similarity`).html() === 0) {
      $(`#record-${i + 1}-similar-articles`).addClass(
        'btn btn-outline-success'
      );
    } else if (+$(`#record-${i + 1}-highest-similarity`).html() <= 30) {
      $(`#record-${i + 1}-similar-articles`).addClass(
        'btn btn-outline-warning'
      );
    } else {
      $(`#record-${i + 1}-highest-similarity`).addClass(
        'btn btn-outline-danger'
      );
    }
  }
});
