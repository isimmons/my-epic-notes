import { useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import { cssBundleHref } from '@remix-run/css-bundle';
import {
  json,
  type DataFunctionArgs,
  type LinksFunction,
  type MetaFunction,
} from '@remix-run/node';
import {
  Link,
  Outlet,
  useFetcher,
  useFetchers,
  useLoaderData,
  useMatches,
} from '@remix-run/react';
import os from 'node:os';
import React from 'react';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import { HoneypotProvider } from 'remix-utils/honeypot/react';
import { z } from 'zod';
import {
  AppToast,
  ErrorList,
  GeneralErrorBoundary,
  SearchBar,
} from '~/components';
import { Button, Icon } from '~/components/ui';
import tailwind from '~/styles/tailwind.css';
import { csrf } from '~/utils/csrf.server';
import { getEnv } from '~/utils/env.server';
import { honeypot } from '~/utils/honeypot.server';
import { getTheme, setTheme, type Theme } from '~/utils/theme.server';
import Document from './document';
import { combineHeaders, invariantResponse } from './utils/misc';
import { toastSessionStorage } from './utils/toast.server';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: tailwind },
  ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
];

export async function loader({ request }: DataFunctionArgs) {
  const honeyProps = honeypot.getInputProps();
  const [csrfToken, csrfCookieHeader] = await csrf.commitToken(request);
  const toastCookieSession = await toastSessionStorage.getSession(
    request.headers.get('cookie'),
  );
  const toast = toastCookieSession.get('toast');

  return json(
    {
      username: os.userInfo().username,
      theme: getTheme(request),
      toast,
      ENV: getEnv(),
      honeyProps,
      csrfToken,
    },
    {
      headers: combineHeaders(
        csrfCookieHeader ? { 'set-cookie': csrfCookieHeader } : null,
        {
          'set-cookie': await toastSessionStorage.commitSession(
            toastCookieSession,
          ),
        },
      ),
    },
  );
}

export async function action({ request }: DataFunctionArgs) {
  const formData = await request.formData();
  invariantResponse(
    formData.get('intent') === 'update-theme',
    'Invalid intent',
    { status: 400 },
  );
  const submission = parse(formData, {
    schema: ThemeFormSchema,
  });
  if (submission.intent !== 'submit') {
    return json({ status: 'success', submission } as const);
  }
  if (!submission.value) {
    return json({ status: 'error', submission } as const, { status: 400 });
  }

  const { theme } = submission.value;

  const responseInit = {
    headers: { 'set-cookie': setTheme(theme) },
  };

  return json({ success: true, submission }, responseInit);
}

const ThemeFormSchema = z.object({
  theme: z.enum(['light', 'dark']),
});

const getSystemTheme = () => {
  if (window.matchMedia) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    } else return 'light';
  }
};

function App() {
  if (typeof window === 'undefined') React.useLayoutEffect = () => {};
  const [systemTheme, setSystemTheme] = React.useState<
    'light' | 'dark' | undefined
  >();

  React.useLayoutEffect(() => {
    setSystemTheme(getSystemTheme());
  }, []);

  const data = useLoaderData<typeof loader>();
  const theme = useTheme() || systemTheme;
  const matches = useMatches();
  const isOnSearchPage = matches.find(m => m.id === 'routes/users+/index');

  return (
    <Document theme={theme} env={data.ENV}>
      <header className="container px-6 py-4 sm:px-8 sm:py-6">
        <nav className="flex items-center justify-between gap-4 sm:gap-6">
          <Link to="/">
            <div className="font-light">epic</div>
            <div className="font-bold">notes</div>
          </Link>
          {isOnSearchPage ? null : (
            <div className="ml-auto max-w-sm flex-1">
              <SearchBar status="idle" />
            </div>
          )}
          <div className="flex items-center gap-10">
            <Button asChild variant="default" size="sm">
              <Link to="/login">Log In</Link>
            </Button>
          </div>
        </nav>
      </header>

      <div className="flex-1">
        <Outlet />
      </div>

      <div className="container flex justify-between">
        <Link to="/">
          <div className="font-light">epic</div>
          <div className="font-bold">notes</div>
        </Link>
        <div className="flex items-center gap-2">
          <p>Built with ♥️ by {data.username}</p>
          <ThemeSwitch userPreference={theme} />
        </div>
      </div>
      <div className="h-5" />
      {data.toast ? <AppToast toast={data.toast} /> : null}
    </Document>
  );
}

export default function AppWithProviders() {
  const data = useLoaderData<typeof loader>();
  return (
    <AuthenticityTokenProvider token={data.csrfToken}>
      <HoneypotProvider {...data.honeyProps}>
        <App />
      </HoneypotProvider>
    </AuthenticityTokenProvider>
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

function useTheme() {
  //optimistic UI
  const data = useLoaderData<typeof loader>();
  const fetchers = useFetchers();
  const fetcher = fetchers.find(
    f => f.formData?.get('intent') === 'update-theme',
  );

  const optimisticTheme = fetcher?.formData?.get('theme');
  if (optimisticTheme === 'light' || optimisticTheme === 'dark') {
    return optimisticTheme;
  }

  return data.theme;
}

// TODO: copy and refactor to use new client hints package
// see if we can get rid of messy hacky way with client script

function ThemeSwitch({ userPreference }: { userPreference?: Theme }) {
  const fetcher = useFetcher<typeof action>();

  const [form] = useForm({
    id: 'theme-switch',
    lastSubmission: fetcher.data?.submission,
    onValidate({ formData }) {
      return parse(formData, { schema: ThemeFormSchema });
    },
  });

  const mode = userPreference || 'light';
  const nextMode = mode === 'light' ? 'dark' : 'light';
  const modeLabel = {
    light: (
      <Icon name="sun">
        <span className="sr-only">Light</span>
      </Icon>
    ),
    dark: (
      <Icon name="moon">
        <span className="sr-only">Dark</span>
      </Icon>
    ),
  };

  return (
    <fetcher.Form method="POST" {...form.props}>
      <input type="hidden" name="theme" value={nextMode} />
      <div className="flex gap-2">
        <button
          name="intent"
          value="update-theme"
          type="submit"
          className="flex h-8 w-8 cursor-pointer items-center justify-center"
        >
          {modeLabel[mode]}
        </button>
      </div>
      <ErrorList errors={form.errors} id={form.errorId} />
    </fetcher.Form>
  );
}

export function ErrorBoundary() {
  return (
    <Document>
      <GeneralErrorBoundary />
    </Document>
  );
}
