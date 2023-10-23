import { json, type DataFunctionArgs, redirect } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { floatingToolbarClassName } from '~/components/floating-toolbar';
import { Button, Input, Label, Textarea } from '~/components/ui';
import { db } from '~/utils/db.server';
import { invariantResponse } from '~/utils/misc';

export async function loader({ params }: DataFunctionArgs) {
  const note = db.note.findFirst({
    where: {
      id: {
        equals: params.noteId,
      },
    },
  });

  invariantResponse(note, 'Note not found', { status: 404 });

  return json({
    note: { title: note.title, content: note.content },
  });
}

export async function action({ request, params }: DataFunctionArgs) {
  const body = await request.formData();
  const title = body.get('title');
  const content = body.get('content');

  invariantResponse(typeof title === 'string', 'title must be of type string');
  invariantResponse(
    typeof content === 'string',
    'content must be of type string',
  );

  db.note.update({
    where: { id: { equals: params.noteId } },
    data: { title, content },
  });

  return redirect(`/users/${params.username}/notes/${params.noteId}`);
}

export default function NoteEdit() {
  const data = useLoaderData<typeof loader>();
  const {
    note: { title, content },
  } = data;

  return (
    <div className="absolute inset-0 flex flex-col pt-12 px-5 ">
      <Form action="" method="post">
        <Label htmlFor="title" className="text-sm md:text-lg">
          Title
        </Label>
        <Input
          name="title"
          type="text"
          defaultValue={title}
          className="text-sm md:text-lg"
        />
        <Label htmlFor="content" className="text-sm md:text-lg">
          Content
        </Label>
        <Textarea
          name="content"
          id="content"
          defaultValue={content}
          className="whitespace-break-spaces text-sm md:text-lg"
        />
        <div className={floatingToolbarClassName}>
          <Button type="reset" variant={'secondary'}>
            Reset
          </Button>
          <Button type="submit">Submit</Button>
        </div>
      </Form>
    </div>
  );
}
