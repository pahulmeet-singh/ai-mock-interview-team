import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function QuestionNav({ questions, answers, currentIndex, onSelect }) {
  return (
    <nav aria-label="Questions" className="lg:sticky lg:top-24 lg:self-start">
      <ol className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible">
        {questions.map((question, index) => {
          const answered = Boolean(answers[index]?.trim());
          const current = index === currentIndex;
          return (
            <li key={index} className="shrink-0 lg:shrink">
              <button
                type="button"
                onClick={() => onSelect(index)}
                aria-current={current ? 'step' : undefined}
                className={cn(
                  'relative flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors',
                  current ? 'bg-accent text-foreground before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                )}
              >
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                    answered ? 'border-success/50 bg-success/10 text-success' : 'border-border',
                  )}
                >
                  {answered ? <Check className="size-3.5" aria-label="Answered" /> : index + 1}
                </span>
                <span className="truncate max-lg:hidden">{question.topic}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
