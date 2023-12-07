import {
  Links,
  LiveReload,
  Meta,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react';
import { type Theme } from './utils/theme.server';
import { Toaster } from 'sonner';

export type DocumentProps = {
  children: React.ReactNode;
  theme?: Theme;
  env?: Record<string, string>;
};

export default function Document({ children, theme, env }: DocumentProps) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${theme ? theme : ''} h-full overflow-x-hidden`}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function () {
              if (typeof document === 'undefined' || typeof window === 'undefined') return;
            
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
                document.cookie =
                  cookieName + '=' + cookieValue + ';' + expires + ';path=/';
              }
            
              const cookieTheme = getCookie('theme');
              const userSystemPreference = window.matchMedia('(prefers-color-scheme: dark)')
                .matches
                ? 'dark'
                : 'light';
            
              if (!cookieTheme) {
                setCookie('theme', userSystemPreference, 365);
            
                document.documentElement.classList.add(userSystemPreference);
              }
            })();
            `,
          }}
        />
        {/* <script src="/js/setSystemTheme.js" /> */}
      </head>
      <body className="flex h-full flex-col justify-between bg-background text-foreground">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(env)}`,
          }}
        />
        <Toaster closeButton position="top-center" />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
