import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';
import config from '../config';
import handleDuplicateError from '../errors/handleDuplicateError';
import handleValidationError from '../errors/handleValidationError';
import handleZodError from '../errors/handleZodError';
import { TErrorSources } from '../interface/error';
import AppError from '../errors/AppError';
import handleCastError from '../errors/handleCastError';

const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = 'Something went wrong!';
  let errorSources: TErrorSources = [{ path: '', message: 'Something went wrong' }];

  // Multer errors fire BEFORE the route handler, so the frontend sees these
  // as 502 / opaque without this branch. Surface them as readable 400/413s.
  if (err instanceof multer.MulterError) {
    const friendly =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File too large. Max upload size is 4 MB.'
        : err.code === 'LIMIT_UNEXPECTED_FILE'
          ? `Unexpected file field "${err.field}". Use the correct form field name.`
          : err.code === 'LIMIT_FILE_COUNT'
            ? 'Too many files in this request.'
            : err.message || 'File upload failed.';

    res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
      success: false,
      message: friendly,
      errorSources: [{ path: err.field ?? '', message: friendly }],
    });
    return;
  }

  // Some image-validation errors are plain Error instances thrown by our
  // multer fileFilter. They have "Unsupported file type:" in the message.
  if (err instanceof Error && err.message?.startsWith('Unsupported file type:')) {
    res.status(415).json({
      success: false,
      message: err.message,
      errorSources: [{ path: 'file', message: err.message }],
    });
    return;
  }

  if (err instanceof ZodError) {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  } else if (err?.name === 'ValidationError') {
    const simplifiedError = handleValidationError(err);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  } else if (err?.name === 'CastError') {
    const simplifiedError = handleCastError(err);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  } else if (err?.code === 11000) {
    const simplifiedError = handleDuplicateError(err);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = err.message
    errorSources = err
  } else if (err instanceof AppError) {
    statusCode = err?.statusCode;
    message = err.message;
    errorSources = [{ path: '', message: err?.message }];
  } else if (err instanceof Error) {
    message = err.message;
    errorSources = [{ path: '', message: err?.message }];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    err,
    stack: config.NODE_ENV === 'development' ? err?.stack : null,
  });

  
};

export default globalErrorHandler;
