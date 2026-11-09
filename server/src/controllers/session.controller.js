import { env } from '../config/env.js';
import { supabase } from '../config/supabase.js';
import { generateQuestions } from '../services/gemini.service.js';
import { DETAIL_COLUMNS, findOwnedInterview, sanitizeAnswers } from '../services/interview.service.js';
import { ApiError } from '../utils/ApiError.js';
import { unwrap } from '../utils/db.js';
import { toInterview } from '../utils/serialize.js';

// POST /api/interviews/:id/session: starts the live session. Gemini writes the questions here.
// Idempotent: calling it again for a session already in progress just returns it.
export async function startSession(req, res) {
  const row = await findOwnedInterview(req.user.id, req.params.id);
  if (row.status === 'in_progress') return res.json({ interview: toInterview(row, { detail: true }) });

  const dto = toInterview(row);
  if (row.status !== 'booked' || dto.status === 'missed') throw new ApiError(409, 'This session can no longer be started.');
  if (!dto.canStart) throw new ApiError(409, 'This session opens 10 minutes before its slot.');

  const questions = await generateQuestions({ category: row.category, difficulty: row.difficulty, count: env.QUESTIONS_PER_SESSION });
  const started = unwrap(
    await supabase
      .from('interviews')
      .update({ status: 'in_progress', questions, answers: {}, started_at: new Date().toISOString() })
      .eq('id', row.id)
      .eq('status', 'booked')
      .select(DETAIL_COLUMNS)
      .maybeSingle(),
  );
  // Lost a race with another tab: return whatever won.
  const current = started ?? (await findOwnedInterview(req.user.id, row.id));
  res.status(started ? 201 : 200).json({ interview: toInterview(current, { detail: true }) });
}

// PUT /api/interviews/:id/answers: idempotent autosave of the draft answers.
export async function saveAnswers(req, res) {
  const row = await findOwnedInterview(req.user.id, req.params.id);
  if (row.status !== 'in_progress') throw new ApiError(409, 'This session is not in progress.');

  const answers = sanitizeAnswers(req.valid.body.answers, row.questions.length);
  unwrap(await supabase.from('interviews').update({ answers }).eq('id', row.id).eq('status', 'in_progress'));
  res.json({ savedAt: new Date().toISOString() });
}
