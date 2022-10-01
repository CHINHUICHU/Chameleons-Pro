/* eslint-disable no-undef */
$(document).ready(async () => {
  // $('#script').load('../layout/script.html');
  $('#page-header').load('../layout/header.html');
  $('#page-footer').load('../layout/footer.html');
  if (localStorage.getItem('current-page') && localStorage.getItem('search')) {
    console.log('test');
    console.log(window.location.href);
    localStorage.removeItem('current-page');
  }

  const token = localStorage.getItem('jwt');
  const header = {
    'Content-Type': 'application/json',
    Authorization: token,
  };

  if (token) {
    try {
      await axios.get('/api/1.0/user/profile', {
        headers: header,
      });
      $('#signup-signin-link').hide();
      $('#user-signin-signup').hide();
      $('#logout-link').show().css({ display: 'block' });
      $('#member-link').show().css({ display: 'block' });
      $('#single-compare-link').show().css({ display: 'block' });
      $('#multiple-compare-link').show().css({ display: 'block' });
      $('#upload-compare-link').show().css({ display: 'block' });
    } catch (error) {
      console.log(error);
    }
  }

  $('#signup-signin-link').click(() => {
    localStorage.setItem('previous-page', window.location.href);
  });

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

  // if ($('body').height() <) {
  // }
});
