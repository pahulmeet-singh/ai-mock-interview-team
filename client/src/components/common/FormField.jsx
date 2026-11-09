import { cloneElement } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Wires a label, a control, a hint and an error message together with the right ids and aria attributes,
// so every form in the app is accessible by construction. `children` is either a single control (it receives
// id / aria props) or a function that gets those props (for composite controls such as Select).
export function FormField({ id, label, error, hint, optional, children, className }) {
  const describedBy = [hint && !error && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  const control = { id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy };

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {optional && <span className="text-xs text-muted-foreground">Optional</span>}
      </div>
      {typeof children === 'function' ? children(control) : cloneElement(children, control)}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
