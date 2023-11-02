import os from 'node:os';
import { cssBundleHref } from '@remix-run/css-bundle';
import { json, type MetaFunction, type LinksFunction } from '@remix-run/node';
import { Link, Outlet, useLoaderData } from '@remix-run/react';
import tailwind from '~/styles/tailwind.css';
import { getEnv } from './utils/env.server';
import Document from './components/document';
import { GeneralErrorBoundary } from './components/error-boundary';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: tailwind },
  ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
];

export async function loader() {
  return json({ username: os.userInfo().username, ENV: getEnv() });
}

export default function App() {
  const data = useLoaderData<typeof loader>();
  return (
    <Document>
      <header className="container mx-auto py-6">
        <nav className="flex justify-between">
          <Link to="/">
            <div className="font-light">epic</div>
            <div className="font-bold">notes</div>
          </Link>
          <Link className="underline" to="users/kody/notes/d27a197e">
            Kody's Notes
          </Link>
        </nav>
      </header>

      <div className="flex-1">
        <Outlet />
      </div>

      <div className="container mx-auto flex justify-between">
        <Link to="/">
          <div className="font-light">epic</div>
          <div className="font-bold">notes</div>
        </Link>
        <p>Built with ♥️ by {data.username}</p>
      </div>
      <div className="h-5" />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
        }}
      />
    </Document>
  );
}

export const meta: MetaFunction = () => {
  return [
    { title: 'Epic Notes' },
    {
      name: 'description',
      content:
        'Remix app based on the Epic Notes app from epicweb.dev, foundations workshop ',
    },
  ];
};

export function ErrorBoundary() {
  return (
    <Document>
      <GeneralErrorBoundary />
    </Document>
  );
}
