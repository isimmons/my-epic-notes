export type Image = {
  id: string;
  altText: string;
  file: File;
};

export type User = {
  id: string;
  name: string;
  username: string;
  image: Image;
};
