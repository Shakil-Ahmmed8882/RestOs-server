import { v2 as cloudinary } from 'cloudinary';
import config from '../../config';
import { MediaConfigError } from './media.errors';

let configured = false;

export const ensureCloudinaryConfigured = (): typeof cloudinary => {
  if (configured) return cloudinary;

  const { cloudinary_cloud_name, cloudinary_api_key, cloudinary_api_secret } = config;

  if (!cloudinary_cloud_name || !cloudinary_api_key || !cloudinary_api_secret) {
    throw new MediaConfigError(
      'Missing Cloudinary credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.',
    );
  }

  cloudinary.config({
    cloud_name: cloudinary_cloud_name,
    api_key: cloudinary_api_key,
    api_secret: cloudinary_api_secret,
    secure: true,
  });

  configured = true;
  return cloudinary;
};

export { cloudinary };
