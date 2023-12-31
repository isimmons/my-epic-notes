import { conform, list, useFieldList, useForm } from '@conform-to/react';
import { getFieldsetConstraint, parse } from '@conform-to/zod';
import { createId as cuid } from '@paralleldrive/cuid2';
import {
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  json,
  unstable_parseMultipartFormData as parseMultipartFormData,
  redirect,
  type DataFunctionArgs,
} from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import {
  ErrorList,
  GeneralErrorBoundary,
  floatingToolbarClassName,
} from '~/components';
import { Button, Input, Label, StatusButton, Textarea } from '~/components/ui';
import { useIsSubmitting } from '~/hooks';
import { MAX_UPLOAD_SIZE, NoteEditorSchema, type ImageConfig } from '~/schemas';
import { validateCsrfToken } from '~/utils/csrf.server';
import { prisma } from '~/utils/db.server';
import { invariantResponse } from '~/utils/misc';
import { ImageChooser } from './_components';

export async function loader({ params }: DataFunctionArgs) {
  const note = await prisma.note.findUnique({
    select: {
      title: true,
      content: true,
      images: { select: { id: true, altText: true } },
    },
    where: { id: params.noteId },
  });

  invariantResponse(note, 'Note not found', { status: 404 });

  return json({ note });
}

export async function action({ request, params }: DataFunctionArgs) {
  const { noteId } = params;
  invariantResponse(noteId, 'noteId param is required');

  const formData = await parseMultipartFormData(
    request,
    createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE }),
  );

  await validateCsrfToken(formData, request.headers);

  function imageHasFile(
    image: ImageConfig,
  ): image is ImageConfig & { file: NonNullable<ImageConfig['file']> } {
    return Boolean(image.file?.size && image.file?.size > 0);
  }

  function imageHasId(
    image: ImageConfig,
  ): image is ImageConfig & { id: NonNullable<ImageConfig['id']> } {
    return image.id != null;
  }
  const submission = await parse(formData, {
    schema: NoteEditorSchema.transform(async ({ images = [], ...data }) => {
      return {
        ...data,
        imageUpdates: await Promise.all(
          images.filter(imageHasId).map(async i => {
            if (imageHasFile(i)) {
              return {
                id: i.id,
                altText: i.altText,
                contentType: i.file.type,
                blob: Buffer.from(await i.file.arrayBuffer()),
              };
            } else {
              return { id: i.id, altText: i.altText };
            }
          }),
        ),
        newImages: await Promise.all(
          images
            .filter(imageHasFile)
            .filter(i => !i.id)
            .map(async image => {
              return {
                altText: image.altText,
                contentType: image.file.type,
                blob: Buffer.from(await image.file.arrayBuffer()),
              };
            }),
        ),
      };
    }),
    async: true,
  });

  if (submission.intent !== 'submit') {
    return json({ status: 'idle', submission } as const);
  }

  if (!submission.value)
    return json({ status: 'error', submission } as const, {
      status: 400,
    });

  const {
    title,
    content,
    imageUpdates = [],
    newImages = [],
  } = submission.value;

  await prisma.note.update({
    select: { id: true },
    where: { id: params.noteId },
    data: {
      title,
      content,
      images: {
        deleteMany: { id: { notIn: imageUpdates.map(i => i.id) } },
        updateMany: imageUpdates.map(updates => ({
          where: { id: updates.id },
          data: { ...updates, id: updates.blob ? cuid() : updates.id },
        })),
        create: newImages,
      },
    },
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
    defaultValue: {
      title,
      content,
      images: images.length ? images : [{}],
    },
  });

  const imageList = useFieldList(form.ref, fields.images);

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
        <AuthenticityTokenInput />
        {/* Allows 'Enter' in text fields without triggering delete button */}
        <button type="submit" className="hidden"></button>

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
            <ul className="flex flex-col gap-4">
              {imageList.map((image, index) => (
                <li
                  key={image.key}
                  className="relative pb-5 border-b-2 border-muted-foreground"
                >
                  <button
                    {...list.remove(fields.images.name, { index })}
                    className="text-foreground-destructive absolute right-0 top-0"
                  >
                    <span aria-hidden>❌</span>{' '}
                    <span className="sr-only">Remove image {index + 1}</span>
                  </button>
                  <ImageChooser config={image} />
                </li>
              ))}
            </ul>
          </div>
          <Button
            className="mt-3"
            {...list.insert(fields.images.name, { defaultValue: {} })}
          >
            <span aria-hidden>➕ Image</span>{' '}
            <span className="sr-only">Add image</span>
          </Button>
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
