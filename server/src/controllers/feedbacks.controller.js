import { env } from '../config/env.js';
import { supabase } from '../config/supabase.js';
import { evaluateInterview } from '../services/gemini.service.js';
import { findOwnedInterview, sanitizeAnswers } from '../services/interview.service.js';
import { ApiError } from '../utils/ApiError.js';
import { unwrap } from '../utils/db.js';
import { toFeedback } from '../utils/serialize.js';

const findFeedback = async (interviewId) =>
  unwrap(await supabase.from('feedbacks').select('*').eq('interview_id', interviewId).maybeSingle());

// POST /api/interviews/:id/feedback: submits the answers and creates the Feedback resource (201).
// If it already exists we return it (200), so a retry after a dropped connection is harmless.
export async function create(req, res) {
  const row = await findOwnedInterview(req.user.id, req.params.id);

  const existing = await findFeedback(row.id);
  if (existing) return res.json({ feedback: toFeedback(existing, row) });
  if (row.status !== 'in_progress') throw new ApiError(409, 'Start the session before submitting it.');

  const answers = sanitizeAnswers(req.valid.body?.answers ?? row.answers, row.questions.length);
  if (Object.keys(answers).length === 0) throw new ApiError(422, 'Answer at least one question before submitting.');

  // Save the answers first: if the AI call fails, the candidate can retry without retyping anything.
  unwrap(await supabase.from('interviews').update({ answers }).eq('id', row.id));

  const items = row.questions.map((q, index) => ({ index, prompt: q.prompt, topic: q.topic, answer: (answers[index] ?? '').trim() }));
  const evaluation = await evaluateInterview({ category: row.category, difficulty: row.difficulty, items });

  const saved = unwrap(
    await supabase
      .from('feedbacks')
      .insert({
        interview_id: row.id,
        user_id: req.user.id,
        overall_score: evaluation.overallScore,
        result: evaluation,
        model: env.GEMINI_MOCK ? 'mock-fixture' : env.GEMINI_MODEL,
      })
      .select()
      .single(),
    { conflict: 'Feedback for this session already exists.' },
  );
  unwrap(await supabase.from('interviews').update({ status: 'completed', submitted_at: new Date().toISOString() }).eq('id', row.id));

  res.status(201).location(`/api/interviews/${row.id}/feedback`).json({ feedback: toFeedback(saved, { ...row, answers }) });
}

export async function getForInterview(req, res) {
  const row = await findOwnedInterview(req.user.id, req.params.id);
  const feedback = await findFeedback(row.id);
  if (!feedback) throw new ApiError(404, 'This session has no feedback yet.');
  res.json({ feedback: toFeedback(feedback, row) });
}

// GET /api/feedbacks: lightweight list for the dashboard (no per-question detail).
export async function list(req, res) {
  const rows = unwrap(
    await supabase
      .from('feedbacks')
      .select('id, interview_id, overall_score, result, model, created_at, interview:interviews(category, difficulty, scheduled_at)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(100),
  );
  res.json({ feedbacks: rows.map((row) => toFeedback(row)) });
}
