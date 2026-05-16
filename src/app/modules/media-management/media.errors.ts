import httpStatus from 'http-status';
import AppError from '../../errors/AppError';

export class MediaUploadError extends AppError {
  constructor(message = 'Failed to upload media') {
    super(httpStatus.BAD_GATEWAY, message);
    this.name = 'MediaUploadError';
  }
}

export class MediaDeleteError extends AppError {
  constructor(message = 'Failed to delete media') {
    super(httpStatus.BAD_GATEWAY, message);
    this.name = 'MediaDeleteError';
  }
}

export class MediaConfigError extends AppError {
  constructor(message = 'Cloudinary is not configured') {
    super(httpStatus.INTERNAL_SERVER_ERROR, message);
    this.name = 'MediaConfigError';
  }
}

export class InvalidMediaError extends AppError {
  constructor(message = 'Invalid media file') {
    super(httpStatus.BAD_REQUEST, message);
    this.name = 'InvalidMediaError';
  }
}
