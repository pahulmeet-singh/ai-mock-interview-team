import { env } from '../config/env.js';

// Database rows are snake_case; the API speaks camelCase. These mappers are the only place that knows both,
// and they keep internals (password_hash, storage paths) from ever leaving the server.
const MINUTE = 60_000;
const first = (value) => (Array.isArray(value) ? (value[0] ?? null) : (value ?? null));

export const toUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  targetRole: u.target_role ?? null,
  createdAt: u.created_at,
});

export const toResume = (r) => ({
  id: r.id,
  fileName: r.file_name,
  sizeBytes: r.size_bytes,
  createdAt: r.created_at,
});

export function sessionWindow(scheduledAt) {
  const start = new Date(scheduledAt).getTime();
  return {
    opensAt: new Date(start - 10 * MINUTE).toISOString(),
    closesAt: new Date(start + 30 * MINUTE).toISOString(),
  };
}

export function toInterview(row, { detail = false, now = Date.now() } = {}) {
  const { opensAt, closesAt } = sessionWindow(row.scheduled_at);
  const enforce = env.SLOT_ENFORCE_WINDOW;
  const missed = row.status === 'booked' && enforce && now > Date.parse(closesAt);
  const inWindow = !enforce || (now >= Date.parse(opensAt) && now <= Date.parse(closesAt));
  const resume = first(row.resume);
  const feedback = first(row.feedback);

  const dto = {
    id: row.id,
    category: row.category,
    difficulty: row.difficulty,
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes,
    status: missed ? 'missed' : row.status, // "missed" is derived, never stored
    canStart: row.status === 'booked' && !missed && inWindow,
    opensAt,
    closesAt,
    startedAt: row.started_at,
    endsAt: row.started_at ? new Date(Date.parse(row.started_at) + row.duration_minutes * MINUTE).toISOString() : null,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
    resume: resume ? { id: resume.id, fileName: resume.file_name } : null,
    feedback: feedback ? { id: feedback.id, overallScore: Number(feedback.overall_score) } : null,
  };

  if (detail) {
    dto.questions = row.questions ?? [];
    dto.answers = row.answers ?? {};
  }
  return dto;
}

// `interview` (the full row) is passed for the detail view so each AI comment can be shown next to the
// question and the candidate's answer. The list view omits it to stay light.
export function toFeedback(row, interview) {
  const result = row.result ?? {};
  const questions = interview?.questions ?? [];
  const answers = interview?.answers ?? {};
  const meta = interview ?? first(row.interview);

  return {
    id: row.id,
    interviewId: row.interview_id,
    overallScore: Number(row.overall_score),
    model: row.model,
    createdAt: row.created_at,
    scores: result.scores,
    summary: result.summary,
    strengths: result.strengths ?? [],
    weaknesses: result.weaknesses ?? [],
    recommendations: result.recommendations ?? [],
    perQuestion: interview
      ? (result.perQuestion ?? []).map((p) => ({
          ...p,
          question: questions[p.index]?.prompt ?? '',
          topic: questions[p.index]?.topic ?? '',
          answer: answers[p.index] ?? '',
        }))
      : undefined,
    interview: meta ? { category: meta.category, difficulty: meta.difficulty, scheduledAt: meta.scheduled_at } : undefined,
  };
}
