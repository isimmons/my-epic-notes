import { json, redirect, type DataFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { GeneralErrorBoundary } from '~/components/error-boundary.tsx';
import { SearchBar } from '~/components/search-bar.tsx';
import { prisma } from '~/utils/db.server.ts';
import { cn, getUserImgSrc } from '~/utils/misc.tsx';
import { useDelayedIsPending } from '~/hooks';
import { Prisma } from '@prisma/client';
import { type User } from '~/types';

export async function loader({ request }: DataFunctionArgs) {
  const searchTerm = new URL(request.url).searchParams.get('search');
  if (searchTerm === '') {
    return redirect('/users');
  }

  const like = `%${searchTerm ?? ''}%`;

  const users = await prisma.$queryRaw<Array<User>>(
    Prisma.sql`
      SELECT id, name, username
      FROM User
      WHERE username
      LIKE ${like} OR name LIKE ${like}
      LIMIT 50`,
  );

  return json({
    status: 'idle',
    users,
  } as const);
}

export default function UsersRoute() {
  const data = useLoaderData<typeof loader>();
  const isPending = useDelayedIsPending({
    formMethod: 'GET',
    formAction: '/users',
  });

  return (
    <div className="container mb-48 mt-36 flex flex-col items-center justify-center gap-6">
      <h1 className="text-h1">Epic Notes Users</h1>
      <div className="w-full max-w-[700px] ">
        <SearchBar status={data.status} autoFocus autoSubmit />
      </div>
      <main>
        {data.status === 'idle' ? (
          // 🦺 TypeScript won't like this. We'll fix it later.
          data.users.length ? (
            <ul
              className={cn(
                'flex w-full flex-wrap items-center justify-center gap-4 delay-200',
                { 'opacity-50': isPending },
              )}
            >
              {/* 🦺 TypeScript won't like this. We'll fix it later. */}
              {data.users.map(user => (
                <li key={user.id}>
                  <Link
                    to={user.username}
                    className="flex h-36 w-44 flex-col items-center justify-center rounded-lg bg-muted px-5 py-3"
                  >
                    <img
                      alt={user.name ?? user.username}
                      src={getUserImgSrc(user.image?.id)}
                      className="h-16 w-16 rounded-full"
                    />
                    {user.name ? (
                      <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-center text-body-md">
                        {user.name}
                      </span>
                    ) : null}
                    <span className="w-full overflow-hidden text-ellipsis text-center text-body-sm text-muted-foreground">
                      {user.username}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>No users found</p>
          )
        ) : null}
      </main>
    </div>
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}