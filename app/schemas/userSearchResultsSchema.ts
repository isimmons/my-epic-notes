import { z } from 'zod';

const UserImageSchema = z.object({
  id: z.string(),
  file: z.custom<File>(),
  altText: z.string().optional(),
});

const UserSearchResultSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string().nullable(),
  image: UserImageSchema.optional(),
});

const UserSearchResultsSchema = z.array(UserSearchResultSchema);

export type UserSearchResults = z.infer<typeof UserSearchResultsSchema>;

export default UserSearchResultsSchema;
