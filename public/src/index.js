/* eslint-disable no-undef */
$(document).ready(async () => {
  if (
    localStorage.getItem('current-page') &&
    window.location.href.split('/').pop() !== 'search'
  ) {
    console.log('test');
    // console.log(window.location.href);
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
    $('#signup-signin-link').show();
  });

  $('#article-search').change(() => {
    localStorage.setItem('search', $('#article-search').val());
    window.location.href = '/search';
  });
});
