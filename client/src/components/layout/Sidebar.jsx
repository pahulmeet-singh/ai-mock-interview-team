import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthContext';
import { useLogout } from '@/features/auth/hooks';
import { NAV_ITEMS } from '@/lib/nav';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

export function Sidebar() {
  const { user } = useAuth();
  const logout = useLogout();
  const open = useUiStore((state) => state.sidebarOpen);
  const closeSidebar = useUiStore((state) => state.closeSidebar);
  const { pathname } = useLocation();

  // On small screens the sidebar is a drawer: close it whenever the route changes.
  useEffect(() => {
    closeSidebar();
  }, [pathname, closeSidebar]);

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={closeSidebar} aria-hidden="true" />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-card transition-transform duration-200 max-lg:shadow-2xl',
          open ? 'translate-x-0' : 'max-lg:-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center px-5">
          <Logo />
        </div>

        <nav aria-label="Main" className="flex-1 space-y-1 px-3 py-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-foreground before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('size-[18px]', isActive && 'text-primary')} aria-hidden="true" />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 border-t p-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-sm font-semibold text-primary" aria-hidden="true">
            {initials(user?.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.targetRole || user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" className="size-9 shrink-0" onClick={() => logout.mutate()} disabled={logout.isPending} aria-label="Sign out">
            <LogOut />
          </Button>
        </div>
      </aside>
    </>
  );
}
