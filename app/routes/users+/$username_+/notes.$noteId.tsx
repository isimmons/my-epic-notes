import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData, useRouteError } from '@remix-run/react';
import { floatingToolbarClassName } from '~/components/floating-toolbar';
import { Button } from '~/components/ui/button';
import { db } from '~/utils/db.server';
import { assertDefined, isErrorResponse } from '~/utils/misc';

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

export function ErrorBoundary() {
  const error = useRouteError();
  console.log(error);

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
        <Button variant="destructive">Delete</Button>
        <Button asChild>
          <Link to="edit">Edit</Link>
        </Button>
      </div>
    </div>
  );
}
