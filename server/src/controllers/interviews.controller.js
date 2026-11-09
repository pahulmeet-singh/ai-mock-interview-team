import { env } from '../config/env.js';
import { supabase } from '../config/supabase.js';
import { DETAIL_COLUMNS, LIST_COLUMNS, findOwnedInterview } from '../services/interview.service.js';
import { isBookableSlot } from '../services/slot.service.js';
import { ApiError } from '../utils/ApiError.js';
import { unwrap } from '../utils/db.js';
import { toInterview } from '../utils/serialize.js';

const GROUPS = {
  upcoming: ['booked', 'in_progress'],
  completed: ['completed'],
  cancelled: ['cancelled', 'missed'],
};

export async function list(req, res) {
  const { status, category } = req.valid.query;
  let query = supabase.from('interviews').select(LIST_COLUMNS).eq('user_id', req.user.id).order('scheduled_at', { ascending: false }).limit(100);
  if (category) query = query.eq('category', category);

  // Filter on the serialized status so derived states ("missed") land in the right tab.
  const interviews = unwrap(await query)
    .map((row) => toInterview(row))
    .filter((interview) => !status || GROUPS[status].includes(interview.status));
  res.json({ interviews });
}

export async function getOne(req, res) {
  const row = await findOwnedInterview(req.user.id, req.params.id);
  res.json({ interview: toInterview(row, { detail: true }) });
}

export async function create(req, res) {
  const { category, difficulty, scheduledAt, resumeId } = req.valid.body;
  const startsAt = new Date(scheduledAt).toISOString();

  if (!isBookableSlot(startsAt)) {
    throw new ApiError(422, 'That time is not an available slot.', { scheduledAt: 'Pick a time from the slot grid.' });
  }
  if (resumeId) {
    const resume = unwrap(await supabase.from('resumes').select('id').eq('id', resumeId).eq('user_id', req.user.id).maybeSingle());
    if (!resume) throw new ApiError(422, 'That resume was not found.', { resumeId: 'Choose one of your uploaded resumes.' });
  }

  // The partial unique index on scheduled_at is the real guard against double booking: when two requests race,
  // the database lets exactly one win and the other gets a 23505, which unwrap() maps to 409 Conflict.
  const row = unwrap(
    await supabase
      .from('interviews')
      .insert({
        user_id: req.user.id,
        category,
        difficulty,
        scheduled_at: startsAt,
        duration_minutes: env.SESSION_MINUTES,
        resume_id: resumeId ?? null,
      })
      .select(DETAIL_COLUMNS)
      .single(),
    { conflict: 'Someone just booked that slot. Pick another time.' },
  );
  res.status(201).location(`/api/interviews/${row.id}`).json({ interview: toInterview(row) });
}

// PATCH /api/interviews/:id  { status: 'cancelled' }
export async function cancel(req, res) {
  const row = await findOwnedInterview(req.user.id, req.params.id);
  if (toInterview(row).status !== 'booked') throw new ApiError(409, 'Only upcoming sessions can be cancelled.');

  const updated = unwrap(
    await supabase
      .from('interviews')
      .update({ status: 'cancelled' })
      .eq('id', row.id)
      .eq('status', 'booked')
      .select(DETAIL_COLUMNS)
      .maybeSingle(),
  );
  if (!updated) throw new ApiError(409, 'This session changed while you were cancelling it. Refresh and try again.');
  res.json({ interview: toInterview(updated) });
}
