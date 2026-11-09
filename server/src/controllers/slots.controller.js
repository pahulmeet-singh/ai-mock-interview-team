import { supabase } from '../config/supabase.js';
import { generateSlots, slotConfig } from '../services/slot.service.js';
import { unwrap } from '../utils/db.js';

// One query tells us which slots in the window are taken (by anyone) and which of those are the caller's own.
export async function list(req, res) {
  const days = generateSlots();
  const all = days.flatMap((day) => day.slots);
  const taken = new Map();

  if (all.length) {
    const rows = unwrap(
      await supabase
        .from('interviews')
        .select('scheduled_at, user_id')
        .neq('status', 'cancelled')
        .gte('scheduled_at', all[0])
        .lte('scheduled_at', all[all.length - 1]),
    );
    for (const row of rows) taken.set(new Date(row.scheduled_at).toISOString(), row.user_id);
  }

  res.json({
    timezone: slotConfig.tz,
    slotMinutes: slotConfig.slotMinutes,
    days: days.map((day) => ({
      date: day.date,
      slots: day.slots.map((startsAt) => ({
        startsAt,
        status: !taken.has(startsAt) ? 'open' : taken.get(startsAt) === req.user.id ? 'mine' : 'taken',
      })),
    })),
  });
}
