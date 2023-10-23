import { json, type DataFunctionArgs } from '@remix-run/node';
import { Link, NavLink, Outlet, useLoaderData } from '@remix-run/react';
import { db } from '~/utils/db.server';
import { assertDefined, cn } from '~/utils/misc.tsx';

export async function loader({ params }: DataFunctionArgs) {
  const user = db.user.findFirst({
    where: {
      username: { equals: params.username },
    },
  });
  const notes = db.note.findMany({
    where: {
      owner: {
        username: { equals: params.username },
      },
    },
  });

  assertDefined(user, 'User Not Found');

  const notesData =
    !notes || notes.length < 1
      ? []
      : notes.map(note => ({ id: note.id, title: note.title }));

  return json({
    user: {
      username: user.username,
      name: user.name,
    },
    notes: notesData,
  });
}

export default function NotesRoute() {
  const data = useLoaderData<typeof loader>();

  const {
    notes,
    user: { username, name },
  } = data;

  const hasNotes = notes.length > 0;

  const navLinkDefaultClassName =
    'line-clamp-2 block rounded-l-full py-2 pl-8 pr-6 text-base lg:text-xl';

  return (
    <main className="container flex min-h-[600px] pb-12 px-0 md:px-8">
      <div className="grid w-full grid-cols-4 bg-muted pl-2 md:container md:mx-2 md:rounded-3xl md:pr-0">
        <div className="relative col-span-1">
          <div className="absolute inset-0 flex flex-col">
            <Link to={`/users/${username}`} className="pb-4 pl-8 pr-4 pt-12">
              <h1 className="text-base font-bold md:text-lg lg:text-left lg:text-2xl">
                {name ?? username}'s Notes
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
