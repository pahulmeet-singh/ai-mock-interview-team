import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Service-role client: bypasses Row Level Security, so it must only ever run on the server.
// Authorization is enforced in our controllers (every query is scoped to req.user.id).
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
