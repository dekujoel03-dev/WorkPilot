import {
  LayoutDashboard,
  FolderKanban,
  Sparkles,
  Bell,
  Search,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { ProgressBar } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
      <div className="pointer-events-none absolute -inset-6 rounded-full bg-gradient-to-tr from-accent/15 via-accent/5 to-transparent blur-3xl opacity-70" />

      <div className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-border/80 bg-surface-elevated shadow-[var(--shadow-lg)] ring-1 ring-accent/10">
        {/* Barre fenêtre */}
        <div className="flex items-center gap-3 border-b border-border/60 bg-surface-sunken/80 px-4 py-2.5">
          <div className="flex shrink-0 gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
          </div>
          <div className="flex min-w-0 flex-1 justify-center">
            <div className="flex h-6 w-full max-w-[220px] items-center justify-center gap-1.5 rounded-md border border-border/60 bg-surface px-2">
              <Search className="h-3 w-3 shrink-0 text-muted" />
              <span className="truncate text-[10px] text-muted">Rechercher…</span>
            </div>
          </div>
        </div>

        <div className="flex min-h-[300px] bg-background sm:min-h-[340px]">
          {/* Mini sidebar — masquée sur très petit écran */}
          <div className="hidden w-36 shrink-0 flex-col gap-1 border-r border-border/60 bg-surface-elevated p-3 sm:flex">
            <div className="mb-2 flex items-center gap-2 px-1 py-1">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-accent to-accent-hover">
                <span className="text-[8px] font-bold text-accent-foreground">WP</span>
              </div>
              <span className="truncate text-xs font-semibold font-display">Acme</span>
            </div>
            {[
              { icon: LayoutDashboard, label: 'Dashboard', active: true },
              { icon: FolderKanban, label: 'Projets', active: false },
              { icon: Sparkles, label: 'Assistant IA', active: false },
            ].map((item) => (
              <div
                key={item.label}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-medium',
                  item.active ? 'bg-accent/10 text-accent' : 'text-muted',
                )}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Contenu dashboard */}
          <div className="flex min-w-0 flex-1 flex-col gap-3 p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold font-display">Bonjour, Alex</p>
                <p className="text-[10px] text-muted">Lundi 27 juillet</p>
              </div>
              <div className="relative shrink-0">
                <Bell className="h-3.5 w-3.5 text-muted" />
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent" />
              </div>
            </div>

            {/* Daily Brief */}
            <div className="space-y-2 rounded-lg border border-accent/20 bg-gradient-to-br from-accent/8 to-transparent p-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 shrink-0 text-accent" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-accent">
                  Daily Brief
                </span>
              </div>
              <p className="text-xs font-medium leading-snug">Objectif : finaliser la release v1</p>
              <ProgressBar value={72} size="sm" />
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {[
                  { label: 'critiques', val: '3', icon: Zap },
                  { label: 'retards', val: '1', icon: AlertTriangle },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-1">
                    <s.icon className="h-3 w-3 text-muted" />
                    <span className="text-[10px] text-muted">
                      {s.val} {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Projets', value: '6' },
                { label: 'Progression', value: '68%' },
                { label: 'Terminées', value: '24' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-border/60 bg-surface-elevated p-2 text-center sm:p-2.5 sm:text-left"
                >
                  <p className="text-[9px] uppercase tracking-wide text-muted">{stat.label}</p>
                  <p className="mt-0.5 text-sm font-bold tabular-nums font-display sm:text-base">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Mini Kanban — visible à partir de sm */}
            <div className="mt-auto hidden grid-cols-3 gap-2 sm:grid">
              {[
                { name: 'À faire', tasks: ['Specs API'], color: '#71717A' },
                { name: 'En cours', tasks: ['Maquettes UI'], color: '#6366F1' },
                { name: 'Terminé', tasks: ['Setup repo'], color: '#22C55E', done: true },
              ].map((col) => (
                <div
                  key={col.name}
                  className="space-y-1.5 rounded-lg border border-border/40 bg-surface-sunken/80 p-2"
                >
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: col.color }} />
                    <span className="truncate text-[9px] font-medium uppercase text-muted">{col.name}</span>
                  </div>
                  {col.tasks.map((t) => (
                    <div
                      key={t}
                      className={cn(
                        'truncate rounded-md border border-border/50 bg-surface-elevated px-2 py-1 text-[10px] font-medium',
                        col.done && 'opacity-70 line-through',
                      )}
                    >
                      {t}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
