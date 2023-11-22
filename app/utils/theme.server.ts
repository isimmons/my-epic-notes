import * as cookie from 'cookie';

const cookieName = 'theme';

export type Theme = 'light' | 'dark';

export function getTheme(request: Request): Theme | undefined {
  const cookieHeader = request.headers.get('cookie');
  const parsed = cookieHeader
    ? cookie.parse(cookieHeader)[cookieName]
    : 'light';
  if (parsed === 'light' || parsed === 'dark') return parsed;
}

export function setTheme(theme: Theme) {
  return cookie.serialize(cookieName, theme, { path: '/' });
}
