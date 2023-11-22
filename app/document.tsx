import {
  Links,
  LiveReload,
  Meta,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react';
import { type Theme } from './utils/theme.server';

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
        <script src="/js/setSystemTheme.js" />
      </head>
      <body className="flex h-full flex-col justify-between bg-background text-foreground">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(env)}`,
          }}
        />

        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
