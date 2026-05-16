export const MEDIA_ROOT_FOLDER = 'RestOS';

export const MEDIA_LIMITS = {
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,
  MAX_FILES_PER_REQUEST: 10,
};

export const ALLOWED_IMAGE_MIME_TYPES: ReadonlyArray<string> = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const DEFAULT_IMAGE_TRANSFORMATION = [
  { quality: 'auto', fetch_format: 'auto' },
];
