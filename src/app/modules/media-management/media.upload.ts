import streamifier from 'streamifier';
import type { UploadApiResponse, UploadApiOptions } from 'cloudinary';
import { ensureCloudinaryConfigured } from './cloudinary.config';
import {
  MEDIA_ROOT_FOLDER,
  DEFAULT_IMAGE_TRANSFORMATION,
} from './media.constants';
import { MediaUploadError, InvalidMediaError } from './media.errors';
import type { UploadOptions, UploadedMedia } from './media.types';

const sanitizePublicId = (publicId: string): string =>
  publicId.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_\-./]/g, '');

const buildFolderPath = (folder: string): string =>
  `${MEDIA_ROOT_FOLDER}/${folder.replace(/^\/+|\/+$/g, '')}`;

export const uploadToCloudinary = (
  options: UploadOptions,
): Promise<UploadedMedia> => {
  const cloudinary = ensureCloudinaryConfigured();

  const {
    fileBuffer,
    folder,
    publicId,
    overwrite = true,
    resourceType = 'image',
    transformation,
    eager,
    tags,
  } = options;

  if (!fileBuffer || !Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    return Promise.reject(new InvalidMediaError('Empty or invalid file buffer'));
  }
  if (!publicId) {
    return Promise.reject(new InvalidMediaError('publicId is required'));
  }

  const uploadOptions: UploadApiOptions = {
    folder: buildFolderPath(folder),
    public_id: sanitizePublicId(publicId),
    overwrite,
    resource_type: resourceType,
    unique_filename: false,
    use_filename: false,
    transformation: transformation ?? DEFAULT_IMAGE_TRANSFORMATION,
    ...(eager ? { eager } : {}),
    ...(tags ? { tags } : {}),
  };

  return new Promise<UploadedMedia>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result?: UploadApiResponse) => {
        if (error || !result) {
          return reject(
            new MediaUploadError(error?.message ?? 'Cloudinary upload failed'),
          );
        }
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          resource_type: result.resource_type,
        });
      },
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

export const uploadManyToCloudinary = async (
  items: UploadOptions[],
): Promise<UploadedMedia[]> => {
  return Promise.all(items.map(uploadToCloudinary));
};
