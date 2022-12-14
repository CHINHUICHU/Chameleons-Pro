/* eslint-disable no-undef */

$(document).ready(async () => {
  $('#signup-submit').click(async (e) => {
    e.preventDefault();
    if (
      validator.isEmpty($('#signup-name').val()) ||
      validator.isEmpty($('#signup-email').val()) ||
      validator.isEmpty($('#signup-password').val())
    ) {
      Swal.fire({
        icon: 'error',
        text: '姓名、Email與密碼為必填資訊',
        showConfirmButton: false,
      });
      return;
    }
    if (!validator.isEmail($('#signup-email').val())) {
      Swal.fire({
        icon: 'error',
        text: 'Email格式錯誤',
        showConfirmButton: false,
      });
      return;
    }

    if (!validator.isLength($('#signup-name').val(), { max: 20 })) {
      Swal.fire({
        icon: 'error',
        text: '姓名長度不可超過20個字',
        showConfirmButton: false,
      });
      return;
    }
    if (!validator.isLength($('#signup-email').val(), { max: 40 })) {
      Swal.fire({
        icon: 'error',
        text: 'Email長度不可超過40個字元',
        showConfirmButton: false,
      });
      return;
    }
    if (!validator.isLength($('#signup-password').val(), { max: 40 })) {
      Swal.fire({
        icon: 'error',
        text: '密碼長度不可超過40個字元',
        showConfirmButton: false,
      });
      return;
    }
    if (!validator.isAlphanumeric($('#signup-password').val())) {
      Swal.fire({
        icon: 'error',
        text: '密碼只能包含大小寫英文字母與數字',
        showConfirmButton: false,
      });
      return;
    }
    try {
      const response = await axios.post('/api/1.0/user/signup', {
        name: $('#signup-name').val(),
        email: $('#signup-email').val(),
        password: $('#signup-password').val(),
      });

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
        showConfirmButton: false,
      });
      window.location.href = localStorage.getItem('previous-page');
    } catch (error) {
      Swal.fire({
        icon: 'error',
        text: error.response.data.message,
        showConfirmButton: false,
      });
    }
  });

  $('#signin-submit').click(async (e) => {
    e.preventDefault();

    if (
      validator.isEmpty($('#signin-email').val()) ||
      validator.isEmpty($('#signin-password').val())
    ) {
      Swal.fire({
        icon: 'error',
        text: 'Email與密碼為必填資訊',
        showConfirmButton: false,
      });
      return;
    }

    if (!validator.isEmail($('#signin-email').val())) {
      Swal.fire({
        icon: 'error',
        text: 'Email格式錯誤',
        showConfirmButton: false,
      });
      return;
    }

    if (!validator.isLength($('#signin-email').val(), { max: 40 })) {
      Swal.fire({
        icon: 'error',
        text: 'Email長度不可超過40個字元',
        showConfirmButton: false,
      });
      return;
    }

    if (!validator.isLength($('#signin-password').val(), { max: 40 })) {
      Swal.fire({
        icon: 'error',
        text: 'Email長度不可超過40個字元',
        showConfirmButton: false,
      });
      return;
    }

    if (!validator.isAlphanumeric($('#signin-password').val())) {
      Swal.fire({
        icon: 'error',
        text: '密碼只能包含大小寫英文字母與數字',
        showConfirmButton: false,
      });
      return;
    }

    try {
      const response = await axios.post('/api/1.0/user/signin', {
        email: $('#signin-email').val(),
        password: $('#signin-password').val(),
      });

      localStorage.setItem('jwt', `Bearer ${response.data.data.access_token}`);
      $('#signup-signin-link').hide();
      $('#logout-link').show().css({ display: 'block' });
      $('#member-link').show().css({ display: 'block' });
      Swal.fire({
        icon: 'success',
        text: '歡迎登入',
        showConfirmButton: false,
      });
      window.location.href = localStorage.getItem('previous-page');
    } catch (error) {
      Swal.fire({
        icon: 'error',
        text: error.response.data.message,
        showConfirmButton: false,
      });
    }
  });
});
