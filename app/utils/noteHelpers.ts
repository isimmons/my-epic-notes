export const getNoteExcerpt = (content: string | undefined) => {
  if (!content) return '';

  return content.substring(0, 200);
};
