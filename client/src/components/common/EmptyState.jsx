import { cn } from '@/lib/utils';

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center rounded-xl border border-dashed px-6 py-12 text-center', className)}>
      {Icon && (
        <span className="mb-4 flex size-11 items-center justify-center rounded-full bg-secondary text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      )}
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
