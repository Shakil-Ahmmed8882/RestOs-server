import { ensureCloudinaryConfigured } from './cloudinary.config';
import type { MediaResourceType } from './media.types';

interface DeleteOptions {
  resourceType?: MediaResourceType;
}

export const deleteFromCloudinary = async (
  publicId?: string | null,
  options: DeleteOptions = {},
): Promise<void> => {
  if (!publicId) return;

  const cloudinary = ensureCloudinaryConfigured();

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: options.resourceType ?? 'image',
      invalidate: true,
    });
    if (result?.result && !['ok', 'not found'].includes(result.result)) {
      console.warn(`[media] unexpected destroy result for ${publicId}:`, result);
    }
  } catch (err) {
    console.error(`[media] failed to delete ${publicId}:`, err);
  }
};

export const deleteManyFromCloudinary = async (
  publicIds: Array<string | null | undefined>,
  options: DeleteOptions = {},
): Promise<void> => {
  const ids = publicIds.filter((id): id is string => Boolean(id));
  if (ids.length === 0) return;
  await Promise.all(ids.map((id) => deleteFromCloudinary(id, options)));
};
