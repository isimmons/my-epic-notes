import { conform, useForm } from '@conform-to/react';
import { parse, getFieldsetConstraint } from '@conform-to/zod';
import {
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  json,
  unstable_parseMultipartFormData as parseMultipartFormData,
  redirect,
  type DataFunctionArgs,
} from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { GeneralErrorBoundary } from '~/components/error-boundary';
import { floatingToolbarClassName } from '~/components/floating-toolbar';
import { Button, Input, Label, StatusButton, Textarea } from '~/components/ui';
import { useIsSubmitting } from '~/hooks';
import { db, updateNote } from '~/utils/db.server';
import { invariantResponse } from '~/utils/misc';
import { ErrorList, ImageChooser } from './_components';

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
    note: {
      title: note.title,
      content: note.content,
      images: note.images.map(i => ({ id: i.id, altText: i.altText })),
    },
  });
}

const titleMaxLength = 100;
const titleMinLength = 5;
const contentMaxLength = 10_000;
const contentMinLength = 5;
const MAX_UPLOAD_SIZE = 1024 * 1024 * 3; // 3MB

const NoteEditorSchema = z.object({
  title: z
    .string({ required_error: 'A note must have a title' })
    .min(titleMinLength, {
      message: `Title must be at least ${titleMinLength} characters`,
    })
    .max(titleMaxLength, {
      message: `Title can not be more than ${titleMaxLength} characters`,
    }),
  content: z
    .string({ required_error: 'A note should have some content' })
    .min(contentMinLength, {
      message: `Content must be at least ${contentMinLength} characters`,
    })
    .max(contentMaxLength, {
      message: `Content can not be more than ${contentMaxLength} characters`,
    }),
});

export async function action({ request, params }: DataFunctionArgs) {
  invariantResponse(params.noteId, 'noteId param is required');

  const formData = await parseMultipartFormData(
    request,
    createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE }),
  );

  const submission = parse(formData, { schema: NoteEditorSchema });

  if (!submission.value)
    return json({ status: 'error', submission } as const, {
      status: 400,
    });

  const { title, content } = submission.value;

  await updateNote({
    id: params.noteId,
    title,
    content,
    images: [
      {
        // @ts-expect-error 🦺 we'll fix this in the next exercise
        id: formData.get('imageId') ?? '',
        // @ts-expect-error 🦺 we'll fix this in the next exercise

        file: formData.get('file') ?? null,
        // @ts-expect-error 🦺 we'll fix this in the next exercise
        altText: formData.get('altText') ?? null,
      },
    ],
  });

  return redirect(`/users/${params.username}/notes/${params.noteId}`);
}

export default function NoteEdit() {
  const [isReset, setIsReset] = useState(false);
  const actionData = useActionData<typeof action>();
  const {
    note: { title, content, images },
  } = useLoaderData<typeof loader>();
  const titleRef = useRef<HTMLInputElement>(null);
  const isSubmitting = useIsSubmitting();

  const [form, fields] = useForm({
    id: 'note-editor',
    constraint: getFieldsetConstraint(NoteEditorSchema),
    lastSubmission: actionData?.submission,
    onValidate({ formData }) {
      return parse(formData, { schema: NoteEditorSchema });
    },
    shouldValidate: 'onBlur',
    defaultValue: { title, content },
  });

  useEffect(() => {
    // refocus first input on form reset
    if (!isReset) return;

    titleRef.current?.focus();
    setIsReset(false);
  }, [isReset]);

  return (
    <div className="absolute inset-0">
      <Form
        method="post"
        className="flex h-full flex-col gap-y-4 overflow-x-hidden px-10 pb-28 pt-12"
        {...form.props}
        encType="multipart/form-data"
      >
        <div className="flex flex-col gap-1">
          <div>
            <Label htmlFor={fields.title.id}>Title</Label>
            <Input ref={titleRef} autoFocus {...conform.input(fields.title)} />
            <div className="min-h-[32px] px-4 pb-3 pt-1">
              <ErrorList
                id={fields.title.errorId}
                errors={fields.title.errors}
              />
            </div>
          </div>
          <div>
            <Label htmlFor={fields.content.id}>Content</Label>
            <Textarea {...conform.textarea(fields.content)} />
            <div className="min-h-[32px] px-4 pb-3 pt-1">
              <ErrorList
                id={fields.content.errorId}
                errors={fields.content.errors}
              />
            </div>
          </div>
          <div>
            <Label>Image</Label>
            <ImageChooser image={images[0]} />
          </div>
        </div>
        <div className="min-h-[32px] px-4 pb-3 pt-1">
          <ErrorList id={form.errorId} errors={form.errors} />
        </div>
      </Form>
      <div className={floatingToolbarClassName}>
        <Button
          form={form.id}
          type="reset"
          onClick={() => setIsReset(true)}
          variant={'secondary'}
        >
          Reset
        </Button>
        <StatusButton
          form={form.id}
          type="submit"
          disabled={isSubmitting}
          status={isSubmitting ? 'pending' : 'idle'}
        >
          Submit
        </StatusButton>
      </div>
    </div>
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
