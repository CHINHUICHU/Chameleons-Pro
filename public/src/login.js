/* eslint-disable no-undef */
$(document).ready(async () => {
  $('#signup-submit').click(async () => {
    try {
      const response = await axios.post('/api/1.0/user/signup', {
        data: {
          name: $('#signup-name').val(),
          email: $('#signup-email').val(),
          password: $('#signup-password').val(),
        },
      });

      console.log(response);

      localStorage.setItem('jwt', `Bearer ${response.data.data.access_token}`);
      $('#signup-signin-link').hide();
      $('#user-signin-signup').hide();
      $('#logout-link').show().css({ display: 'block' });
      $('#member-link').show().css({ display: 'block' });
      $('#main').show();
      $('#finish').show();
      Swal.fire({
        icon: 'success',
        text: '歡迎使用CHAMELEONS PRO',
      });
      $('.swal2-styled.swal2-confirm').click(() => {
        window.location.href = localStorage.getItem('previous-page');
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: error.response.data.message,
      });
      // alert(error.response.data.message);
    }
  });

  $('#signin-submit').click(async () => {
    try {
      const response = await axios.post('/api/1.0/user/signin', {
        data: {
          email: $('#signin-email').val(),
          password: $('#signin-password').val(),
        },
      });

      console.log(response);

      localStorage.setItem('jwt', `Bearer ${response.data.data.access_token}`);
      $('#signup-signin-link').hide();
      $('#logout-link').show().css({ display: 'block' });
      $('#member-link').show().css({ display: 'block' });
      Swal.fire({
        icon: 'success',
        text: '歡迎登入',
      });
      $('.swal2-styled.swal2-confirm').click(() => {
        window.location.href = localStorage.getItem('previous-page');
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: error.response.data.message,
      });
    }
  });
});
