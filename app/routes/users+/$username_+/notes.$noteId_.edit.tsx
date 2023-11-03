import { json, type DataFunctionArgs, redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { useId } from 'react';
import { GeneralErrorBoundary } from '~/components/error-boundary';
import { floatingToolbarClassName } from '~/components/floating-toolbar';
import { Button, Input, Label, StatusButton, Textarea } from '~/components/ui';
import { useHydrated, useIsSubmitting } from '~/hooks';
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

type ActionErrors = {
  formErrors: Array<string>;
  fieldErrors: {
    title: Array<string>;
    content: Array<string>;
  };
};

const titleMaxLength = 100;
const contentMaxLength = 10_000;

export async function action({ request, params }: DataFunctionArgs) {
  const body = await request.formData();
  const title = body.get('title');
  const content = body.get('content');

  invariantResponse(typeof title === 'string', 'title must be of type string');
  invariantResponse(
    typeof content === 'string',
    'content must be of type string',
  );

  const errors: ActionErrors = {
    formErrors: [],
    fieldErrors: {
      title: [],
      content: [],
    },
  };

  if (title === '') errors.fieldErrors.title.push('Title is required');
  if (title.length > titleMaxLength)
    errors.fieldErrors.title.push(
      `Title must be ${titleMaxLength} characters or less`,
    );

  if (content === '') errors.fieldErrors.content.push('Content is required');
  if (content.length > contentMaxLength)
    errors.fieldErrors.content.push(
      `Content must be ${contentMaxLength} characters or less`,
    );

  const hasErrors =
    errors.formErrors.length > 0 ||
    Object.values(errors.fieldErrors).some(
      fieldErrors => fieldErrors.length > 0,
    );

  if (hasErrors)
    return json({ status: 'error', errors } as const, { status: 400 });

  db.note.update({
    where: { id: { equals: params.noteId } },
    data: { title, content },
  });

  return redirect(`/users/${params.username}/notes/${params.noteId}`);
}

function ErrorList({
  id,
  errors,
}: {
  id?: string;
  errors?: Array<string> | null;
}) {
  if (!errors || errors.length < 1) return null;

  return (
    <ul id={id} className="flex flex-col gap-1 text-sm text-red-600 italic">
      {errors.map((error, i) => (
        <li key={i}>{error}</li>
      ))}
    </ul>
  );
}

export default function NoteEdit() {
  const {
    note: { title, content },
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const isSubmitting = useIsSubmitting();

  const fieldErrors =
    actionData?.status === 'error' ? actionData.errors.fieldErrors : null;
  const formErrors =
    actionData?.status === 'error' ? actionData.errors.formErrors : null;

  const formId = 'note-editor';
  const formHasErrors = !!formErrors?.length;
  const formErrorsId = useId();

  const titleId = useId();
  const titleHasErrors = !!fieldErrors?.title.length;
  const titleErrorsId = useId();

  const contentId = useId();
  const contentHasErrors = !!fieldErrors?.content.length;
  const contentErrorsId = useId();

  const isHydrated = useHydrated();
  return (
    <Form
      noValidate={isHydrated}
      id={formId}
      action=""
      method="post"
      aria-invalid={formHasErrors || undefined}
      aria-describedby={formHasErrors ? formErrorsId : undefined}
      className="flex h-full flex-col gap-y-4 overflow-x-hidden px-10 pb-28 pt-12"
    >
      <div className="flex flex-col gap-1">
        <div>
          <Label htmlFor={titleId}>Title</Label>
          <Input
            id={titleId}
            name="title"
            type="text"
            defaultValue={title}
            required
            maxLength={100}
            aria-invalid={titleHasErrors || undefined}
            aria-describedby={titleHasErrors ? titleErrorsId : undefined}
          />
          <div className="min-h-[32px] px-4 pb-3 pt-1">
            <ErrorList id={titleErrorsId} errors={fieldErrors?.title} />
          </div>
        </div>
        <div>
          <Label htmlFor={contentId}>Content</Label>
          <Textarea
            id={contentId}
            name="content"
            defaultValue={content}
            required
            maxLength={10_000}
            aria-invalid={contentHasErrors || undefined}
            aria-describedby={contentHasErrors ? contentErrorsId : undefined}
          />
          <div className="min-h-[32px] px-4 pb-3 pt-1">
            <ErrorList id={contentErrorsId} errors={fieldErrors?.content} />
          </div>

          <div className="min-h-[32px] px-4 pb-3 pt-1">
            <ErrorList id={formErrorsId} errors={formErrors} />
          </div>
        </div>
      </div>
      <div className={floatingToolbarClassName}>
        <Button form={formId} type="reset" variant={'secondary'}>
          Reset
        </Button>
        <StatusButton
          form={formId}
          type="submit"
          disabled={isSubmitting}
          status={isSubmitting ? 'pending' : 'idle'}
        >
          Submit
        </StatusButton>
      </div>
    </Form>
  );
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
