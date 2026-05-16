export type MediaFolder =
  | 'users'
  | 'foods'
  | 'restaurants'
  | 'categories'
  | 'blogs'
  | 'tests';

export type MediaResourceType = 'image' | 'video' | 'raw' | 'auto';

export interface UploadOptions {
  fileBuffer: Buffer;
  folder: MediaFolder | string;
  publicId: string;
  overwrite?: boolean;
  resourceType?: MediaResourceType;
  transformation?: Record<string, unknown>[];
  eager?: Record<string, unknown>[];
  tags?: string[];
}

export interface UploadedMedia {
  url: string;
  public_id: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  resource_type?: string;
}

export interface StoredMedia {
  url: string;
  public_id: string;
}
