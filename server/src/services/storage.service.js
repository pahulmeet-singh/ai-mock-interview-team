import { env } from '../config/env.js';
import { supabase } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';
import { MAX_RESUME_BYTES } from '../middleware/upload.js';

const bucket = () => supabase.storage.from(env.SUPABASE_RESUME_BUCKET);

// Creates the private bucket on first boot so setup is one step shorter.
export async function ensureBucket() {
  const { data } = await supabase.storage.getBucket(env.SUPABASE_RESUME_BUCKET);
  if (data) return;
  const { error } = await supabase.storage.createBucket(env.SUPABASE_RESUME_BUCKET, {
    public: false,
    fileSizeLimit: MAX_RESUME_BYTES,
    allowedMimeTypes: ['application/pdf'],
  });
  if (error) throw error;
}

export async function uploadPdf(path, buffer) {
  const { error } = await bucket().upload(path, buffer, { contentType: 'application/pdf', upsert: false });
  if (error) {
    console.error('[storage] upload failed:', error.message);
    throw new ApiError(502, 'The file could not be stored. Please try again.');
  }
}

// The bucket is private: files are only reachable through short-lived signed URLs we hand out per request.
export async function createDownloadUrl(path, seconds = 60) {
  const { data, error } = await bucket().createSignedUrl(path, seconds);
  if (error) {
    console.error('[storage] signed url failed:', error.message);
    throw new ApiError(502, 'Could not create a download link.');
  }
  return data.signedUrl;
}

export async function removeFile(path) {
  const { error } = await bucket().remove([path]);
  if (error) console.error('[storage] remove failed:', error.message);
}
