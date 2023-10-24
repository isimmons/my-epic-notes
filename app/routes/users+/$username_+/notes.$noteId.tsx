import {
  json,
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaFunction,
} from '@remix-run/node';
import { Form, Link, useLoaderData, useRouteError } from '@remix-run/react';
import { floatingToolbarClassName } from '~/components/floating-toolbar';
import { Button } from '~/components/ui/button';
import { db } from '~/utils/db.server';
import { assertDefined, isErrorResponse } from '~/utils/misc';
import { getNoteExcerpt } from '~/utils/noteHelpers';
import { type NotesLoader } from './notes';

export async function loader({ params }: LoaderFunctionArgs) {
  const note = db.note.findFirst({
    where: {
      id: { equals: params.noteId },
    },
  });

  assertDefined(note, 'Note Not Found');

  return json({
    note: {
      title: note.title,
      content: note.content,
    },
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
  const form = await request.formData();
  const intent = form.get('intent');

  switch (intent) {
    case 'delete': {
      db.note.delete({ where: { id: { equals: params.noteId } } });
      break;
    }
    default: {
      throw new Response(`Invalid intent: ${intent}`);
    }
  }

  return redirect(`/users/${params.username}/notes`);
}

export function ErrorBoundary() {
  const error = useRouteError();

  const isError = isErrorResponse(error);

  return (
    <div className="absolute inset-0 flex flex-col px-10">
      {isError && (
        <>
          <h2 className="mb-2 pt-12 text-h2 lg:mb-6">{error.status}</h2>
          <p className="whitespace-break-spaces text-sm md:text-lg">
            {error.data}
          </p>
        </>
      )}
    </div>
  );
}

export default function NoteRoute() {
  const data = useLoaderData<typeof loader>();

  const {
    note: { title, content },
  } = data;

  return (
    <div className="absolute inset-0 flex flex-col px-10">
      <h2 className="mb-2 pt-12 text-h2 lg:mb-6">{title}</h2>
      <div className="overflow-y-auto pb-24">
        <p className="whitespace-break-spaces text-sm md:text-lg">{content}</p>
      </div>
      <div className={floatingToolbarClassName}>
        <Form method="POST">
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
