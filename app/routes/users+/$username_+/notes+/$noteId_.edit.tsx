import { json, type DataFunctionArgs, redirect } from '@remix-run/node';
import {
  Form,
  useActionData,
  useLoaderData,
  useRevalidator,
} from '@remix-run/react';
import { useEffect, useId, useRef } from 'react';
import { GeneralErrorBoundary } from '~/components/error-boundary';
import { floatingToolbarClassName } from '~/components/floating-toolbar';
import { Button, Input, Label, StatusButton, Textarea } from '~/components/ui';
import { useHydrated, useIsSubmitting } from '~/hooks';
import { db } from '~/utils/db.server';
import { invariantResponse } from '~/utils/misc';
import ErrorList from './_components/ErrorList';
import { useFocusInvalid } from '~/hooks/useFocusInvalid';
import { z } from 'zod';

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

const titleMaxLength = 100;
const titleMinLength = 5;
const contentMaxLength = 10_000;
const contentMinLength = 5;

const NoteEditorSchema = z.object({
  title: z
    .string()
    .min(titleMinLength, {
      message: `Title must be at least ${titleMinLength} characters`,
    })
    .max(titleMaxLength, {
      message: `Title can not be more than ${titleMaxLength} characters`,
    }),
  content: z
    .string()
    .min(contentMinLength, {
      message: `Content must be at least ${contentMinLength} characters`,
    })
    .max(contentMaxLength, {
      message: `Content can not be more than ${contentMaxLength} characters`,
    }),
});

export async function action({ request, params }: DataFunctionArgs) {
  invariantResponse(params.noteId, 'noteId param is required');
  const formData = await request.formData();

  const result = NoteEditorSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  });

  if (!result.success)
    return json({ status: 'error', errors: result.error.flatten() } as const, {
      status: 400,
    });

  const { title, content } = result.data;

  db.note.update({
    where: { id: { equals: params.noteId } },
    data: { title, content },
  });

  return redirect(`/users/${params.username}/notes/${params.noteId}`);
}

export default function NoteEdit() {
  const revalidator = useRevalidator();
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const actionData = useActionData<typeof action>();
  const errors = actionData?.errors;

  const {
    note: { title, content },
  } = useLoaderData<typeof loader>();
  const isSubmitting = useIsSubmitting();

  const formId = 'note-editor';
  const formHasErrors = !!errors?.formErrors.length;
  const formErrorsId = useId();

  const titleId = useId();
  const titleHasErrors = !!errors?.fieldErrors.title?.length;
  const titleErrorsId = useId();

  const contentId = useId();
  const contentHasErrors = !!errors?.fieldErrors.content?.length;
  const contentErrorsId = useId();
  const formIsFresh = !formHasErrors && !titleHasErrors && !contentHasErrors;
  const isHydrated = useHydrated();

  const clearErrors = () => {
    if (revalidator.state === 'idle') {
      revalidator.revalidate();
    }
  };

  useFocusInvalid(formRef.current, [
    formHasErrors,
    titleHasErrors,
    contentHasErrors,
  ]);

  useEffect(() => {
    if (!formIsFresh) return;

    titleRef.current?.focus();
  }, [formIsFresh]);

  return (
    <Form
      noValidate={isHydrated}
      id={formId}
      action=""
      method="post"
      aria-invalid={formHasErrors || undefined}
      aria-describedby={formHasErrors ? formErrorsId : undefined}
      ref={formRef}
      tabIndex={-1}
      className="flex h-full flex-col gap-y-4 overflow-x-hidden px-10 pb-28 pt-12"
    >
      <div className="flex flex-col gap-1">
        <div>
          <Label htmlFor={titleId}>Title</Label>
          <Input
            ref={titleRef}
            id={titleId}
            name="title"
            type="text"
            defaultValue={title}
            required
            maxLength={titleMaxLength}
            aria-invalid={titleHasErrors || undefined}
            aria-describedby={titleHasErrors ? titleErrorsId : undefined}
            autoFocus
          />
          <div className="min-h-[32px] px-4 pb-3 pt-1">
            <ErrorList id={titleErrorsId} errors={errors?.fieldErrors.title} />
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
            <ErrorList
              id={contentErrorsId}
              errors={errors?.fieldErrors.content}
            />
          </div>

          <div className="min-h-[32px] px-4 pb-3 pt-1">
            <ErrorList id={formErrorsId} errors={errors?.formErrors} />
          </div>
        </div>
      </div>
      <div className={floatingToolbarClassName}>
        <Button
          form={formId}
          type="reset"
          onClick={clearErrors}
          variant={'secondary'}
        >
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
