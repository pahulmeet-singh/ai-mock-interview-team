import { Textarea } from '@/components/ui/textarea';
import { countWords, formatTime } from '@/lib/format';
import { useSessionStore } from '@/stores/sessionStore';

function SaveIndicator() {
  const saveState = useSessionStore((state) => state.saveState);
  const lastSavedAt = useSessionStore((state) => state.lastSavedAt);
  const dirty = useSessionStore((state) => state.dirty);

  let text = 'Answers save automatically';
  if (saveState === 'saving') text = 'Saving...';
  else if (saveState === 'error') text = 'Could not save. We will retry when you type again.';
  else if (dirty) text = 'Unsaved changes';
  else if (lastSavedAt) text = `Saved at ${formatTime(lastSavedAt)}`;

  return (
    <span role="status" className={saveState === 'error' ? 'text-destructive' : undefined}>
      {text}
    </span>
  );
}

// A CONTROLLED textarea whose single source of truth is the Zustand store: value comes from the store and every
// keystroke goes back through setAnswer(), which builds a new answers object.
export function AnswerEditor({ index }) {
  const value = useSessionStore((state) => state.answers[index] ?? '');
  const setAnswer = useSessionStore((state) => state.setAnswer);
  const words = countWords(value); // derived on each render, never stored

  return (
    <div>
      <Textarea
        value={value}
        onChange={(event) => setAnswer(index, event.target.value)}
        maxLength={6000}
        rows={11}
        autoFocus
        className="min-h-72 text-[15px]"
        placeholder="Answer as you would out loud: start with the main point, explain how it works, then give an example."
        aria-label={`Answer to question ${index + 1}`}
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="tabular">
          {words} {words === 1 ? 'word' : 'words'}. Aim for 4 to 8 sentences.
        </span>
        <SaveIndicator />
      </div>
    </div>
  );
}
