import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useWorkspaces, useSwitchWorkspace } from '../hooks/use-workspace-switch';
import { cn } from '@/lib/utils';

export function WorkspaceSwitcher() {
  const workspace = useAuthStore((s) => s.workspace);
  const { data: workspaces = [] } = useWorkspaces();
  const switchWs = useSwitchWorkspace();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (workspaces.length <= 1) return null;

  return (
    <div className="relative px-3 pb-2" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-border bg-surface-hover/50 px-3 py-2 text-xs text-muted hover:text-foreground"
      >
        <span className="truncate">{workspace?.name}</span>
        <ChevronDown className="h-3 w-3 shrink-0" />
      </button>
      {open && (
        <div className="absolute left-3 right-3 top-full mt-1 z-50 rounded-[var(--radius-md)] border border-border bg-surface shadow-lg py-1">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              type="button"
              disabled={switchWs.isPending}
              onClick={() => {
                switchWs.mutate(ws.id);
                setOpen(false);
              }}
              className={cn(
                'w-full text-left px-3 py-2 text-xs hover:bg-surface-hover',
                ws.id === workspace?.id && 'bg-accent/10 text-accent font-medium',
              )}
            >
              {ws.name}
              <span className="text-muted ml-1">({ws.role})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
