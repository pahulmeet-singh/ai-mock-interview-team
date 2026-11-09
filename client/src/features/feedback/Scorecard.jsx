import { RubricRow } from '@/components/common/RubricRow';
import { ScoreRing } from '@/components/common/ScoreRing';
import { CRITERIA } from '@/lib/constants';
import { verdict } from './stats';

// The one piece of the product that gets to be memorable: a marksheet. Overall score and verdict up top, then
// one rubric row per criterion, filled in tick by tick.
export function Scorecard({ feedback }) {
  return (
    <section aria-labelledby="scorecard-heading" className="rounded-xl border bg-card">
      <div className="flex flex-wrap items-center gap-6 border-b p-6">
        <ScoreRing value={feedback.overallScore} />
        <div className="min-w-0 flex-1 basis-72">
          <h2 id="scorecard-heading" className="font-display text-2xl font-semibold">
            {verdict(feedback.overallScore)}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{feedback.summary}</p>
        </div>
      </div>
      <div className="divide-y divide-border/60 px-6">
        {CRITERIA.map((criterion, index) => (
          <RubricRow key={criterion.key} label={criterion.label} hint={criterion.hint} value={feedback.scores?.[criterion.key] ?? 0} index={index} />
        ))}
      </div>
    </section>
  );
}
