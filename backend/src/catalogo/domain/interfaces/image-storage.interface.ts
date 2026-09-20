export const IMAGE_STORAGE = 'IImageStorage';

export type ImageUpload = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

export interface IImageStorage {
  upload(file: ImageUpload): Promise<string>;
}
