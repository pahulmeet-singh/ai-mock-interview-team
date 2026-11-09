import { z } from 'zod';

export const MAX_RESUMES = 5;
export const MAX_RESUME_BYTES = 5 * 1024 * 1024;

// Validates a File object before we spend bandwidth on it. The server checks the same things again.
export const resumeFileSchema = z
  .instanceof(File, { error: 'Choose a PDF file.' })
  .refine((file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'), 'Only PDF files are supported.')
  .refine((file) => file.size > 0, 'That file is empty.')
  .refine((file) => file.size <= MAX_RESUME_BYTES, 'That file is larger than 5 MB.');
