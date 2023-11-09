import { z } from 'zod';

const titleMaxLength = 100;
const titleMinLength = 5;
const contentMaxLength = 10_000;
const contentMinLength = 5;
export const MAX_UPLOAD_SIZE = 1024 * 1024 * 3; // 3MB
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const ImageFieldsetSchema = z.object({
  id: z.string().optional(),
  file: z
    .instanceof(File)
    .refine(
      file => file?.size && file.size <= MAX_UPLOAD_SIZE,
      `Max file size is ${MAX_UPLOAD_SIZE} KB.`,
    )
    .refine(
      file => file?.size && ACCEPTED_IMAGE_TYPES.includes(file?.type),
      '.jpg, .jpeg, .png and .webp files are accepted.',
    )
    .optional(),
  altText: z.string().optional(),
});

export type ImageConfig = z.infer<typeof ImageFieldsetSchema>;

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
  images: z.array(ImageFieldsetSchema),
});

export default NoteEditorSchema;
