import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Calendar,
  Sparkles,
  Menu,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const primaryItems = [
  { icon: LayoutDashboard, label: 'Accueil', href: '/app' },
  { icon: FolderKanban, label: 'Projets', href: '/app/projects' },
  { icon: Calendar, label: 'Calendrier', href: '/app/calendar' },
  { icon: Sparkles, label: 'IA', href: '/app/assistant' },
];

const moreItems = [{ icon: Users, label: 'Équipe', href: '/app/team' }];

export function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {moreOpen && (
        <div className="fixed bottom-16 inset-x-0 z-50 mx-4 mb-2 rounded-[var(--radius-lg)] border border-border bg-surface shadow-lg p-2 md:hidden">
          <div className="flex items-center justify-between px-2 py-1 mb-1">
            <span className="text-sm font-medium">Plus</span>
            <button
              type="button"
              onClick={() => setMoreOpen(false)}
              className="p-1 text-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {moreItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => setMoreOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium',
                  isActive ? 'bg-surface-hover text-foreground' : 'text-muted',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </div>
      )}

      <nav className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-around border-t border-border bg-surface/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)] md:hidden">
        {primaryItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/app'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium min-w-0',
                isActive ? 'text-accent' : 'text-muted',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          className={cn(
            'flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium',
            moreOpen ? 'text-accent' : 'text-muted',
          )}
        >
          <Menu className="h-5 w-5" />
          <span>Plus</span>
        </button>
      </nav>
    </>
  );
}
