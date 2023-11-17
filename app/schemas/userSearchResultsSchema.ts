import { z } from 'zod';

const UserSearchResultSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string().nullable(),
  imageId: z.string().nullable(),
});

const UserSearchResultsSchema = z.array(UserSearchResultSchema);

export type UserSearchResults = z.infer<typeof UserSearchResultsSchema>;

export default UserSearchResultsSchema;
