import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';
import { unwrap } from '../utils/db.js';
import { clearAuthCookie, setAuthCookie, signToken } from '../utils/jwt.js';
import { toUser } from '../utils/serialize.js';

const BCRYPT_ROUNDS = 10;
// Compared against when the email is unknown so a missing account takes as long as a wrong password.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

export async function register(req, res) {
  const { name, email, password, targetRole } = req.valid.body;
  const user = unwrap(
    await supabase
      .from('users')
      .insert({ name, email, password_hash: await bcrypt.hash(password, BCRYPT_ROUNDS), target_role: targetRole || null })
      .select()
      .single(),
    { conflict: 'An account with this email already exists.' },
  );
  setAuthCookie(res, signToken(user));
  res.status(201).json({ user: toUser(user) });
}

export async function login(req, res) {
  const { email, password } = req.valid.body;
  const user = unwrap(await supabase.from('users').select().eq('email', email).maybeSingle());
  const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) throw new ApiError(401, 'Incorrect email or password.');
  setAuthCookie(res, signToken(user));
  res.json({ user: toUser(user) });
}

export function logout(_req, res) {
  clearAuthCookie(res);
  res.status(204).end();
}

// GET /api/auth/me: "who am I?". Signed out is a normal answer ({ user: null }), not an error, so the browser
// console stays clean on every first visit. Any other endpoint answers 401 when you are not signed in.
export async function me(req, res) {
  if (!req.user) return res.json({ user: null });
  const user = unwrap(await supabase.from('users').select().eq('id', req.user.id).maybeSingle());
  if (!user) {
    clearAuthCookie(res); // the account was deleted while a token was still valid
    return res.json({ user: null });
  }
  res.json({ user: toUser(user) });
}
