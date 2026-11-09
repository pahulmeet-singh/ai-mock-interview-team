import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ErrorState } from './ErrorState';

// The router's error boundary: a crash while rendering a page lands here instead of a blank screen.
export function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error?.message;
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-6">
      <ErrorState title="This page hit a problem" error={{ message }} />
      <div className="flex gap-2">
        <Button onClick={() => window.location.reload()}>Reload</Button>
        <Button asChild variant="outline">
          <Link to="/">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
