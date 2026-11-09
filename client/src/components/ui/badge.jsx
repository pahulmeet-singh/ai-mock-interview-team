import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium', {
  variants: {
    variant: {
      primary: 'border-primary/30 bg-primary/10 text-primary',
      success: 'border-success/30 bg-success/10 text-success',
      danger: 'border-destructive/30 bg-destructive/10 text-destructive',
      muted: 'border-border bg-muted text-muted-foreground',
      outline: 'border-border text-foreground',
    },
  },
  defaultVariants: { variant: 'muted' },
});

export const Badge = ({ className, variant, ...props }) => <span className={cn(badgeVariants({ variant }), className)} {...props} />;
