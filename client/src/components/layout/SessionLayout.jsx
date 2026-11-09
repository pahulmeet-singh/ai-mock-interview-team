import { Outlet } from 'react-router-dom';

// The live interview is full-width with no sidebar: nothing should compete with the question on screen.
export default function SessionLayout() {
  return (
    <div className="min-h-screen bg-background">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <main id="main">
        <Outlet />
      </main>
    </div>
  );
}
