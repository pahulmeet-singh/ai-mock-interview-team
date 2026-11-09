export const APP_NAME = 'Mockroom';
export const APP_TIMEZONE = import.meta.env.VITE_APP_TIMEZONE ?? 'Asia/Kolkata';

export const DIFFICULTIES = [
  { value: 'foundation', label: 'Foundation', hint: 'Core concepts and definitions' },
  { value: 'intermediate', label: 'Intermediate', hint: 'Applying ideas and weighing trade-offs' },
  { value: 'advanced', label: 'Advanced', hint: 'Edge cases and design depth' },
];
export const DIFFICULTY_LABEL = Object.fromEntries(DIFFICULTIES.map((d) => [d.value, d.label]));

export const STATUS = {
  booked: { label: 'Booked', tone: 'primary' },
  in_progress: { label: 'In progress', tone: 'primary' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'muted' },
  missed: { label: 'Missed', tone: 'danger' },
};

// The five rubric criteria the AI scores. The keys match server/src/schemas/feedback.schema.js.
export const CRITERIA = [
  { key: 'technicalAccuracy', label: 'Technical accuracy', short: 'Accuracy', hint: 'Is what you said correct?' },
  { key: 'depth', label: 'Depth', short: 'Depth', hint: 'Mechanisms and trade-offs, not just definitions' },
  { key: 'problemSolving', label: 'Problem solving', short: 'Problem solving', hint: 'Reasoning toward an answer and handling edge cases' },
  { key: 'communication', label: 'Communication', short: 'Communication', hint: 'Clear, concise and easy to follow' },
  { key: 'structure', label: 'Structure', short: 'Structure', hint: 'Context, approach, conclusion' },
];

// One colour language for every score in the app.
export const scoreTone = (score) => (score >= 7.5 ? 'success' : score >= 5 ? 'primary' : 'danger');
export const TONE_TEXT = { success: 'text-success', primary: 'text-primary', danger: 'text-destructive' };
export const TONE_BG = { success: 'bg-success', primary: 'bg-primary', danger: 'bg-destructive' };
export const TONE_STROKE = { success: 'stroke-success', primary: 'stroke-primary', danger: 'stroke-destructive' };
