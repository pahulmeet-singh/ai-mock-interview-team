import { Toaster as Sonner } from 'sonner';

// Toast notifications, themed with our design tokens.
export const Toaster = (props) => (
  <Sonner
    theme="dark"
    position="bottom-right"
    style={{
      '--normal-bg': 'hsl(var(--popover))',
      '--normal-text': 'hsl(var(--foreground))',
      '--normal-border': 'hsl(var(--border))',
      '--success-bg': 'hsl(var(--popover))',
      '--success-text': 'hsl(var(--success))',
      '--success-border': 'hsl(var(--success) / 0.4)',
      '--error-bg': 'hsl(var(--popover))',
      '--error-text': 'hsl(var(--destructive))',
      '--error-border': 'hsl(var(--destructive) / 0.4)',
    }}
    {...props}
  />
);
