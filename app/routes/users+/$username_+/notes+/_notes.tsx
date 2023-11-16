import {
  json,
  type DataFunctionArgs,
  type MetaFunction,
} from '@remix-run/node';
import { Link, NavLink, Outlet, useLoaderData } from '@remix-run/react';
import { GeneralErrorBoundary } from '~/components/error-boundary';
import { prisma } from '~/utils/db.server';
import { assertDefined, cn, getUserImgSrc } from '~/utils/misc.tsx';

export async function loader({ params }: DataFunctionArgs) {
  const user = await prisma.user.findUnique({
    select: {
      username: true,
      name: true,
      image: true,
      notes: { select: { id: true, title: true } },
    },
    where: { username: params.username },
  });

  assertDefined(user, 'User Not Found');

  return json({
    user,
  });
}

export type NotesLoader = typeof loader;

export const meta: MetaFunction<NotesLoader> = ({ data, params }) => {
  const displayName = data?.user.name ?? params.username;

  return [
    { title: `${displayName}'s Notes` },
    {
      name: 'description',
      content: `Notes written by ${displayName}`,
    },
  ];
};

export default function NotesRoute() {
  const data = useLoaderData<typeof loader>();

  const {
    user: { username, name, image, notes },
  } = data;

  const displayName = name ?? username;

  const hasNotes = notes.length > 0;

  const navLinkDefaultClassName =
    'line-clamp-2 block rounded-l-full py-2 pl-8 pr-6 text-base lg:text-xl';

  return (
    <main className="container flex h-full min-h-[400px] pb-12 px-0 md:px-8">
      <div className="grid w-full grid-cols-4 bg-muted pl-2 md:container md:mx-2 md:rounded-3xl md:pr-0">
        <div className="relative col-span-1">
          <div className="absolute inset-0 flex flex-col">
            <Link
              to={`/users/${username}`}
              className="flex flex-col items-center justify-center gap-2 bg-muted pb-4 pl-8 pr-4 pt-12 lg:flex-row lg:justify-start lg:gap-4"
            >
              <img
                src={getUserImgSrc(image?.id)}
                alt={displayName}
                className="h-16 w-16 rounded-full object-cover lg:h-24 lg:w-24"
              />
              <h1 className="text-center text-base font-bold md:text-lg lg:text-left lg:text-2xl">
                {displayName}'s Notes
              </h1>
            </Link>
            {!hasNotes && <p>This user has no notes yet.</p>}
            {hasNotes && (
              <ul className="overflow-y-auto overflow-x-hidden pb-12">
                {notes.map(note => (
                  <li key={note.id} className="p-1 pr-0">
                    <NavLink
                      to={note.id}
                      prefetch="intent"
                      preventScrollReset
                      className={({ isActive }) =>
                        cn(navLinkDefaultClassName, isActive && 'bg-accent')
                      }
                    >
                      {note.title}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="relative col-span-3 bg-accent md:rounded-r-3xl">
          <Outlet />
        </div>
      </div>
    </main>
  );
}

export function ErrorBoundary() {
  return (
    <GeneralErrorBoundary
      statusHandlers={{
        404: ({ params }) => <p>No user notes found for {params.username}</p>,
      }}
    />
  );
}
