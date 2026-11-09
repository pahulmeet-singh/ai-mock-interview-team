import { Logo } from './Logo';

// Shown while the app decides whether you are signed in, and while a route's code is first downloaded.
export function Splash() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-screen items-center justify-center">
      <span className="sr-only">Loading</span>
      <Logo className="animate-pulse" />
    </div>
  );
}
