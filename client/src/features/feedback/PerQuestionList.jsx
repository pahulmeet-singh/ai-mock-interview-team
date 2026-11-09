import { ChevronDown } from 'lucide-react';
import { TONE_TEXT, scoreTone } from '@/lib/constants';
import { formatScore } from '@/lib/format';
import { cn } from '@/lib/utils';

function Block({ title, children, muted }) {
  return (
    <div>
      <h4 className="text-xs font-medium text-muted-foreground">{title}</h4>
      <p className={cn('mt-1 whitespace-pre-wrap text-sm leading-relaxed', muted && 'italic text-muted-foreground')}>{children}</p>
    </div>
  );
}

// <details> gives us an accessible, keyboard-friendly accordion with no extra library.
export function PerQuestionList({ items }) {
  return (
    <ol className="divide-y rounded-xl border bg-card">
      {items.map((item) => (
        <li key={item.index}>
          <details className="group">
            <summary className="flex cursor-pointer list-none items-start gap-4 px-5 py-4 transition-colors hover:bg-accent/30 [&::-webkit-details-marker]:hidden">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">{item.index + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-muted-foreground">{item.topic}</span>
                <span className="block font-medium leading-snug">{item.question}</span>
              </span>
              <span className={cn('tabular font-display text-lg font-semibold', TONE_TEXT[scoreTone(item.score)])}>{formatScore(item.score)}</span>
              <ChevronDown className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="space-y-4 border-t px-5 py-5 sm:pl-[4.25rem]">
              <Block title="Your answer" muted={!item.answer}>
                {item.answer || 'No answer was submitted.'}
              </Block>
              <Block title="What the interviewer noticed">{item.feedback}</Block>
              <Block title="A stronger answer">{item.betterAnswer}</Block>
            </div>
          </details>
        </li>
      ))}
    </ol>
  );
}
