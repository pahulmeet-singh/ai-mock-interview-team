import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;

// Memory storage: the file goes straight from the request to Supabase Storage, never to local disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RESUME_BYTES, files: 1 },
  fileFilter: (_req, file, cb) =>
    file.mimetype === 'application/pdf' ? cb(null, true) : cb(new ApiError(415, 'Only PDF files are supported.')),
});

export const uploadResume = (req, res, next) =>
  upload.single('file')(req, res, (err) => {
    if (err) return next(err);
    if (!req.file) return next(new ApiError(400, 'Attach a PDF in the "file" field.'));
    // The MIME type comes from the client, so also check the PDF magic bytes.
    if (req.file.buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
      return next(new ApiError(415, 'That file does not look like a valid PDF.'));
    }
    next();
  });
