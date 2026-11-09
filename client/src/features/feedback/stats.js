import { CRITERIA } from '@/lib/constants';
import { average, groupBy, sortBy } from '@/lib/immutable';

// Everything the dashboard shows is DERIVED from the list of feedbacks. Nothing is stored twice, so the numbers
// can never disagree with the data. (DashboardPage wraps this in useMemo so it only reruns when the list changes.)
export function summarizeFeedbacks(feedbacks, categoryTitles = {}) {
  if (feedbacks.length === 0) {
    return { count: 0, average: 0, byCriterion: [], byCategory: [], trend: [], strongest: null, weakest: null, recent: [] };
  }

  const chronological = sortBy(feedbacks, (f) => f.createdAt);

  const byCriterion = CRITERIA.map(({ key, label, short }) => ({
    key,
    label,
    short,
    value: average(feedbacks.map((f) => f.scores?.[key] ?? 0)),
  }));

  const grouped = groupBy(feedbacks, (f) => f.interview?.category ?? 'unknown');
  const byCategory = sortBy(
    Object.entries(grouped).map(([category, items]) => ({
      category,
      title: categoryTitles[category] ?? category,
      average: average(items.map((i) => i.overallScore)),
      count: items.length,
    })),
    (c) => c.average,
    'desc',
  );

  const ranked = sortBy(byCriterion, (c) => c.value, 'desc');

  return {
    count: feedbacks.length,
    average: average(feedbacks.map((f) => f.overallScore)),
    byCriterion,
    byCategory,
    trend: chronological.map((f) => ({ id: f.id, createdAt: f.createdAt, score: f.overallScore })),
    strongest: ranked[0],
    weakest: ranked[ranked.length - 1],
    recent: sortBy(feedbacks, (f) => f.createdAt, 'desc').slice(0, 5),
  };
}

export function verdict(score) {
  if (score >= 8) return 'Interview-ready';
  if (score >= 6.5) return 'Strong showing';
  if (score >= 5) return 'Getting there';
  return 'Needs more practice';
}
