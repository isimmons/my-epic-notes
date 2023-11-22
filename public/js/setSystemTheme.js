function getCookie(cookieName) {
  const name = cookieName + '=';
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    let c = cookies[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
}

function setCookie(cookieName, cookieValue, expirationDays) {
  const date = new Date();
  date.setTime(date.getTime() + expirationDays * 24 * 60 * 60 * 1000);
  const expires = 'expires=' + date.toUTCString();
  document.cookie = cookieName + '=' + cookieValue + ';' + expires + ';path=/';
}

const cookieTheme = getCookie('theme');
const userSystemPreference = window.matchMedia('(prefers-color-scheme: dark)')
  .matches
  ? 'dark'
  : 'light';

if (!cookieTheme) {
  setCookie('theme', userSystemPreference, 365);

  // document.documentElement.classList.remove('light');
  // document.documentElement.classList.remove('dark');
  document.documentElement.classList.add(userSystemPreference);
}
