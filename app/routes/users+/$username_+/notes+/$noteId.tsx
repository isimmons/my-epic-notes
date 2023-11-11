import {
  json,
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaFunction,
} from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';
import { floatingToolbarClassName } from '~/components/floating-toolbar';
import { Button } from '~/components/ui/button';
import { db } from '~/utils/db.server';
import { assertDefined } from '~/utils/misc';
import { getNoteExcerpt } from '~/utils/noteHelpers';
import { type NotesLoader } from './_notes';
import { GeneralErrorBoundary } from '~/components/error-boundary';
import { CSRFError } from 'remix-utils/csrf/server';
import { csrf } from '~/utils/csrf.server.ts';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';

export async function loader({ params }: LoaderFunctionArgs) {
  const note = db.note.findFirst({
    where: {
      id: { equals: params.noteId },
    },
  });

  // TODO: use the invariantResponse to be consistent
  assertDefined(note, 'Note Not Found');

  return json({
    note: {
      title: note.title,
      content: note.content,
      images: note.images.map(i => ({ id: i.id, altText: i.altText })),
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
  const formData = await request.formData();
  const intent = formData.get('intent');
  // TODO: extract to csrf utils
  try {
    await csrf.validate(formData, request.headers);
  } catch (error) {
    if (error instanceof CSRFError)
      throw new Response(error.message, { status: 403 });

    throw error;
  }

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
              <a href={`/resources/images/${image.id}`}>
                <img
                  src={`/resources/images/${image.id}`}
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
