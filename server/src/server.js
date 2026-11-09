import app from './app.js';
import { env } from './config/env.js';
import { supabase } from './config/supabase.js';
import { ensureBucket } from './services/storage.service.js';

// A friendly boot-time check: tells you immediately if the keys are wrong or schema.sql was not run.
async function checkSupabase() {
  const { error } = await supabase.from('users').select('id', { count: 'exact', head: true });
  if (error) {
    console.warn(`[warn] Supabase check failed (${error.code ?? 'no code'}): ${error.message}`);
    console.warn('       Check SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY, and run server/db/schema.sql in the SQL editor.');
    if (error.code === '42501') console.warn('       "permission denied": re-run the GRANT lines at the end of schema.sql.');
    return;
  }
  console.log('[ok]   Supabase reachable, tables found');
  try {
    await ensureBucket();
    console.log(`[ok]   Storage bucket "${env.SUPABASE_RESUME_BUCKET}" ready`);
  } catch (err) {
    console.warn(`[warn] Could not prepare the storage bucket: ${err.message}`);
  }
}

const server = app.listen(env.PORT, () => {
  const ai = env.GEMINI_MOCK ? 'mock fixtures' : `${env.GEMINI_MODEL} via ${env.GEMINI_API}`;
  console.log(`API listening on http://localhost:${env.PORT}  (${env.NODE_ENV}, AI: ${ai})`);
  checkSupabase();
});

function shutdown(signal) {
  console.log(`\n${signal} received, closing server`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
