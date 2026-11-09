import { randomUUID } from 'node:crypto';
import { basename } from 'node:path';
import { supabase } from '../config/supabase.js';
import { createDownloadUrl, removeFile, uploadPdf } from '../services/storage.service.js';
import { ApiError } from '../utils/ApiError.js';
import { unwrap } from '../utils/db.js';
import { toResume } from '../utils/serialize.js';

const MAX_RESUMES = 5;

const findOwned = async (userId, id) => {
  const row = unwrap(await supabase.from('resumes').select('*').eq('id', id).eq('user_id', userId).maybeSingle());
  if (!row) throw new ApiError(404, 'Resume not found.');
  return row;
};

// multer decodes file names as latin1; re-decode as UTF-8 and strip anything unsafe for display.
const cleanName = (original) =>
  basename(Buffer.from(original, 'latin1').toString('utf8')).replace(/[^\p{L}\p{N}._() -]/gu, '_').slice(0, 120) || 'resume.pdf';

export async function list(req, res) {
  const rows = unwrap(await supabase.from('resumes').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false }));
  res.json({ resumes: rows.map(toResume) });
}

export async function create(req, res) {
  const { count, error } = await supabase.from('resumes').select('id', { count: 'exact', head: true }).eq('user_id', req.user.id);
  unwrap({ data: null, error });
  if (count >= MAX_RESUMES) throw new ApiError(409, `You can keep up to ${MAX_RESUMES} resumes. Delete one to upload another.`);

  const path = `${req.user.id}/${randomUUID()}.pdf`;
  await uploadPdf(path, req.file.buffer);

  try {
    const row = unwrap(
      await supabase
        .from('resumes')
        .insert({ user_id: req.user.id, file_name: cleanName(req.file.originalname), file_url: path, mime_type: 'application/pdf', size_bytes: req.file.size })
        .select()
        .single(),
    );
    res.status(201).location(`/api/resumes/${row.id}`).json({ resume: toResume(row) });
  } catch (err) {
    await removeFile(path); // don't leave an orphaned file behind
    throw err;
  }
}

export async function remove(req, res) {
  const row = await findOwned(req.user.id, req.params.id);
  await removeFile(row.file_url);
  unwrap(await supabase.from('resumes').delete().eq('id', row.id)); // interviews.resume_id is set to null by the FK
  res.status(204).end();
}

// The bucket is private, so the browser gets a one-minute signed URL instead of a permanent link.
export async function download(req, res) {
  const row = await findOwned(req.user.id, req.params.id);
  res.json({ url: await createDownloadUrl(row.file_url), fileName: row.file_name });
}
