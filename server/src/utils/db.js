import { ApiError } from './ApiError.js';

// supabase-js never throws: it returns { data, error }. unwrap() turns errors into ApiErrors
// so controllers can read like straight-line code and the error handler formats every failure the same way.
export function unwrap({ data, error }, { conflict } = {}) {
  if (!error) return data;
  if (error.code === '23505') throw new ApiError(409, conflict ?? 'That record already exists.');
  if (error.code === '23503') throw new ApiError(422, 'A related record does not exist.');
  console.error('[supabase]', error.code, error.message);
  throw new ApiError(500, 'Database error.');
}
