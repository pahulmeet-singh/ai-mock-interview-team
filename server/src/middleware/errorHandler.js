import multer from 'multer';
import { env } from '../config/env.js';

export function notFound(req, res) {
  res.status(404).json({ error: { status: 404, message: `No route for ${req.method} ${req.originalUrl}` } });
}

// One place decides how every failure looks to the client: { error: { status, message, fieldErrors? } }.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = Number.isInteger(err.status) ? err.status : 500;
  let message = err.message;

  if (err instanceof multer.MulterError) {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'That file is larger than 5 MB.' : 'The upload could not be processed.';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'The request body is not valid JSON.';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'The request body is too large.';
  }

  if (status >= 500) {
    console.error(err);
    if (env.NODE_ENV === 'production') message = 'Something went wrong on our side.';
  }

  res.status(status).json({ error: { status, message, ...(err.fieldErrors && { fieldErrors: err.fieldErrors }) } });
}
