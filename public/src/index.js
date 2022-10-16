/* eslint-disable no-undef */

$(document).ready(async () => {
  $('#page-header').load('../layout/header.html');
  $('#page-footer').load('../layout/footer.html');
  if (localStorage.getItem('current-page') && localStorage.getItem('search')) {
    localStorage.removeItem('current-page');
  }

  const token = localStorage.getItem('jwt');
  const header = {
    'Content-Type': 'application/json',
    Authorization: token,
  };

  if (token) {
    try {
      response = await axios.get('/api/1.0/user/profile', {
        headers: header,
      });
      $('#signup-signin-link').hide();
      $('#user-signin-signup').hide();
      $('#logout-link').show().css({ display: 'block' });
      $('#member-link').show().css({ display: 'block' });
      $('#single-compare-link').show().css({ display: 'block' });
      $('#multiple-compare-link').show().css({ display: 'block' });
      $('#upload-compare-link').show().css({ display: 'block' });

      // console.log(response.data.data);
    } catch (error) {
      console.log(error);
    }
  }

  $('#logout-link').click(() => {
    localStorage.removeItem('jwt');
    window.location.href = '/';
    $('#logout-link').hide();
    $('#member-link').hide();
    $('#single-compare-link').hide();
    $('#multiple-compare-link').hide();
    $('#upload-compare-link').hide();
    $('#signup-signin-link').show();
  });

  $('#article-search').change(() => {
    localStorage.setItem('search', $('#article-search').val());
    window.location.href = '/search';
  });

  const socket = io({ reconnectionDelayMax: 10000, auth: { token } });

  // client-side
  socket.on('connect', () => {
    // console.log('connect', socket.id);
  });

  socket.on('finish', () => {
    Swal.fire({
      icon: 'success',
      text: '比對結果出爐，請至會員頁查看結果',
      showConfirmButton: false,
    });
    setTimeout(() => {
      window.location.href = '/user';
    }, 500);
  });

  // client-side
  socket.on('connect_error', () => {
    socket.disconnect();
    // console.log('disconnect due to auth error');
  });

  socket.on('disconnect', () => {
    // console.log('disconnected...');
  });
});

$(document).on('click', '#signup-signin-link', () => {
  localStorage.setItem('previous-page', window.location.href);
});
