import { Outlet, Navigate, useNavigate, NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Calendar,
  Search,
  Settings,
  LogOut,
  Sparkles,
  Users,
} from 'lucide-react';
import { PendingInvitesBanner } from '@/features/team/components/pending-invites-banner';
import { WorkspaceSwitcher } from '@/features/team/components/workspace-switcher';
import { useAuthSync } from '@/features/auth/hooks/use-auth-sync';
import { useAuthStore } from '@/stores/auth.store';
import { logoutSession } from '@/lib/api';
import { ThemeToggle } from '@/components/theme-toggle';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { NotificationBell } from '@/features/collaboration/components/notification-bell';
import { useWebSocket } from '@/features/collaboration/hooks/use-websocket';
import { CommandPalette, useCommandPalette } from '@/features/search/components/command-palette';
import { MobileNav } from './mobile-nav';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/app' },
  { icon: FolderKanban, label: 'Projets', href: '/app/projects' },
  { icon: Calendar, label: 'Calendrier', href: '/app/calendar' },
  { icon: Sparkles, label: 'Assistant', href: '/app/assistant' },
  { icon: Users, label: 'Équipe', href: '/app/team' },
];

export function AppLayout() {
  const { user, workspace } = useAuthStore();
  const authReady = useAuthSync();
  const navigate = useNavigate();
  const palette = useCommandPalette();
  useWebSocket();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!authReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-sm text-muted">
        Chargement…
      </div>
    );
  }

  const handleLogout = async () => {
    await logoutSession();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden md:flex w-[260px] flex-col border-r border-border/80 bg-surface-elevated">
        <div className="flex h-16 items-center gap-3 px-5 border-b border-border/80">
          <Logo variant="mark" asLink={false} size="sm" className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate font-display">{workspace?.name ?? 'Espace de travail'}</p>
            <p className="text-[11px] text-muted truncate">{workspace?.slug}</p>
          </div>
        </div>
        <WorkspaceSwitcher />

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/app'}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted hover:text-foreground hover:bg-surface-hover',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="nav-active-indicator" />}
                  <item.icon className={cn('h-4 w-4 shrink-0', isActive && 'text-accent')} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border/80">
          <div className="flex items-center gap-3 rounded-[var(--radius-lg)] px-2 py-2 hover:bg-surface-hover transition-colors">
            <Avatar firstName={user.firstName} lastName={user.lastName} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[11px] text-muted truncate">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 text-muted hover:text-foreground rounded-[var(--radius-sm)] hover:bg-surface transition-colors"
              title="Déconnexion"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="relative z-40 flex h-14 items-center justify-between gap-4 px-4 md:px-6 glass shrink-0">
          <button
            type="button"
            onClick={palette.toggle}
            className="flex items-center gap-2 flex-1 max-w-md rounded-[var(--radius-lg)] border border-border/80 bg-surface-sunken/50 px-3.5 py-2 text-sm text-muted hover:border-accent/30 hover:bg-surface transition-all"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span>Rechercher…</span>
            <kbd className="ml-auto hidden sm:inline-flex h-5 items-center rounded-md border border-border bg-surface px-1.5 text-[10px] font-medium text-muted">
              ⌘K
            </kbd>
          </button>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <NotificationBell />
            <Link
              to="/app/settings"
              className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              title="Paramètres"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-auto pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 bg-background">
          <PendingInvitesBanner />
          <Outlet />
        </main>
      </div>

      <MobileNav />
      <CommandPalette open={palette.open} onClose={palette.close} />
    </div>
  );
}
