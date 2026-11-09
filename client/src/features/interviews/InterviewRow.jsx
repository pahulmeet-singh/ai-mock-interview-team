import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DIFFICULTY_LABEL, TONE_TEXT, scoreTone } from '@/lib/constants';
import { formatDateTime, formatScore } from '@/lib/format';
import { cn } from '@/lib/utils';

export const InterviewRow = memo(function InterviewRow({ interview, categoryTitle }) {
  const score = interview.feedback?.overallScore;
  return (
    <li>
      <Link
        to={interview.status === 'completed' ? `/interviews/${interview.id}/feedback` : `/interviews/${interview.id}`}
        className="grid items-center gap-x-6 gap-y-1 px-5 py-4 transition-colors hover:bg-accent/40 sm:grid-cols-[minmax(0,1fr)_13rem_7.5rem_3.5rem]"
      >
        <div className="min-w-0">
          <p className="truncate font-medium">{categoryTitle}</p>
          <p className="text-sm text-muted-foreground">{DIFFICULTY_LABEL[interview.difficulty]}</p>
        </div>
        <p className="text-sm">{formatDateTime(interview.scheduledAt)}</p>
        <div>
          <StatusBadge status={interview.status} />
        </div>
        <div className="flex items-center justify-end">
          {score !== undefined ? (
            <span className={cn('tabular font-display text-lg font-semibold', TONE_TEXT[scoreTone(score)])}>{formatScore(score)}</span>
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
      </Link>
    </li>
  );
});
