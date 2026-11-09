import { Outlet, useNavigation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/stores/uiStore';
import { Sidebar } from './Sidebar';

// A thin bar across the top while a lazy route chunk is loading.
function NavigationProgress() {
  const { state } = useNavigation();
  if (state !== 'loading') return null;
  return <div role="progressbar" aria-label="Loading page" className="fixed inset-x-0 top-0 z-50 h-0.5 animate-pulse bg-primary" />;
}

export default function AppShell() {
  const openSidebar = useUiStore((state) => state.openSidebar);

  return (
    <div className="min-h-screen lg:pl-64">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <NavigationProgress />
      <Sidebar />

      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur lg:hidden">
        <Button variant="ghost" size="icon" className="size-9" onClick={openSidebar} aria-label="Open menu">
          <Menu />
        </Button>
        <Logo />
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
        <Outlet />
      </main>
    </div>
  );
}
