import { supabase } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';
import { unwrap } from '../utils/db.js';

// Embedded selects: PostgREST joins related tables for us (interviews → resumes, interviews → feedbacks).
export const LIST_COLUMNS =
  'id, category, difficulty, scheduled_at, duration_minutes, status, started_at, submitted_at, created_at, resume:resumes(id, file_name), feedback:feedbacks(id, overall_score)';
export const DETAIL_COLUMNS = '*, resume:resumes(id, file_name), feedback:feedbacks(id, overall_score)';

// Every query is scoped to the signed-in user. A row that belongs to someone else is reported as 404, not 403,
// so ids cannot be probed.
export async function findOwnedInterview(userId, id) {
  const row = unwrap(await supabase.from('interviews').select(DETAIL_COLUMNS).eq('id', id).eq('user_id', userId).maybeSingle());
  if (!row) throw new ApiError(404, 'Interview not found.');
  return row;
}

// Keep only answers for questions that exist, and drop blanks.
export function sanitizeAnswers(raw = {}, questionCount) {
  const clean = {};
  for (let i = 0; i < questionCount; i++) {
    const value = raw[i] ?? raw[String(i)];
    if (typeof value === 'string' && value.trim()) clean[i] = value;
  }
  return clean;
}
