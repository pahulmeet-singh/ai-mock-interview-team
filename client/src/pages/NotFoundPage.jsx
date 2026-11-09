import { Link } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function Component() {
  useDocumentTitle('Page not found');
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <div>
        <h1 className="font-display text-4xl font-semibold">That page does not exist</h1>
        <p className="mt-2 text-muted-foreground">The link may be old, or the address may have a typo.</p>
      </div>
      <Button asChild>
        <Link to="/">Back to the dashboard</Link>
      </Button>
    </div>
  );
}
