import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type MetaFunction,
} from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { GeneralErrorBoundary, floatingToolbarClassName } from '~/components';
import { Button } from '~/components/ui';
import { validateCsrfToken } from '~/utils/csrf.server';
import { prisma } from '~/utils/db.server';
import { invariantResponse } from '~/utils/misc';
import { getNoteExcerpt } from '~/utils/noteHelpers';
import { type NotesLoader } from './_notes';
import { toastSessionStorage } from '~/utils/toast.server';

export async function loader({ params }: LoaderFunctionArgs) {
  const note = await prisma.note.findUnique({
    select: {
      title: true,
      content: true,
      images: { select: { id: true, altText: true } },
    },
    where: { id: params.noteId },
  });

  invariantResponse(note, 'Not Found', { status: 404 });

  return json({
    note,
  });
}

export type NoteByIdLoader = typeof loader;

export const meta: MetaFunction<
  NoteByIdLoader,
  {
    'routes/users+/$username_+/notes': NotesLoader;
  }
> = ({ data, params, matches }) => {
  const noteMatch = matches.find(
    m => m.id === 'routes/users+/$username_+/notes',
  );

  const displayName = noteMatch?.data.user.name ?? params.username;

  const noteTitle = data?.note.title ?? 'Note';
  const noteContent = getNoteExcerpt(data?.note.content);

  return [
    { title: `${noteTitle} | By: ${displayName}` },
    {
      name: 'description',
      content: `${getNoteExcerpt(noteContent)}`,
    },
  ];
};

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  await validateCsrfToken(formData, request.headers);

  switch (intent) {
    case 'delete': {
      await prisma.note.delete({
        select: { id: true },
        where: { id: params.noteId },
      });
      break;
    }
    default: {
      throw new Response(`Invalid intent: ${intent}`);
    }
  }

  const toastCookieSession = await toastSessionStorage.getSession(
    request.headers.get('cookie'),
  );
  toastCookieSession.set('toast', {
    type: 'success',
    title: 'Note deleted',
    description: 'Your note has been deleted',
  });

  return redirect(`/users/${params.username}/notes`, {
    headers: {
      'set-cookie': await toastSessionStorage.commitSession(toastCookieSession),
    },
  });
}

export function ErrorBoundary() {
  return (
    <GeneralErrorBoundary
      statusHandlers={{
        404: ({ params }) => <p>Note does not exist with id {params.noteId}</p>,
      }}
    />
  );
}

export default function NoteRoute() {
  const data = useLoaderData<typeof loader>();

  const {
    note: { title, content, images },
  } = data;

  return (
    <div className="absolute inset-0 flex flex-col px-10">
      <h2 className="mb-2 pt-12 text-h2 lg:mb-6">{title}</h2>
      <div className="overflow-y-auto pb-24">
        <ul className="flex flex-wrap gap-5 py-5">
          {images.map(image => (
            <li key={image.id}>
              <a href={`/resources/note-images/${image.id}`}>
                <img
                  src={`/resources/note-images/${image.id}`}
                  alt={image.altText ?? ''}
                  className="h-32 w-32 rounded-lg object-cover"
                />
              </a>
            </li>
          ))}
        </ul>
        <p className="whitespace-break-spaces text-sm md:text-lg">{content}</p>
      </div>
      <div className={floatingToolbarClassName}>
        <Form method="POST">
          <AuthenticityTokenInput />
          <Button
            type="submit"
            variant="destructive"
            name="intent"
            value="delete"
          >
            Delete
          </Button>
        </Form>
        <Button asChild>
          <Link to="edit">Edit</Link>
        </Button>
      </div>
    </div>
  );
}
