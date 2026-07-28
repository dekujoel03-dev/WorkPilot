import { cn } from '@/lib/utils';

const variants = {
  default: 'bg-surface-hover text-foreground border border-border',
  accent: 'bg-accent/10 text-accent border border-accent/20',
  success: 'bg-success/10 text-success border border-success/20',
  warning: 'bg-warning/10 text-warning border border-warning/20',
  danger: 'bg-danger/10 text-danger border border-danger/20',
  urgent: 'bg-danger/15 text-danger border border-danger/30 font-semibold',
  high: 'bg-warning/10 text-warning border border-warning/20',
  medium: 'bg-accent/10 text-accent border border-accent/20',
  low: 'bg-surface-hover text-muted border border-border',
  outline: 'bg-transparent text-muted border border-border',
} as const;

export type BadgeVariant = keyof typeof variants;

export function Badge({
  children,
  variant = 'default',
  className,
  dot,
  dotColor,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
  dotColor?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap',
        variants[variant],
        className,
      )}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full shrink-0"
          style={{ backgroundColor: dotColor ?? 'currentColor' }}
        />
      )}
      {children}
    </span>
  );
}

export const PRIORITY_BADGE: Record<string, BadgeVariant> = {
  URGENT: 'urgent',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  NONE: 'outline',
};

export const PRIORITY_LABELS: Record<string, string> = {
  URGENT: 'Urgent',
  HIGH: 'Haute',
  MEDIUM: 'Moyenne',
  LOW: 'Basse',
  NONE: '',
};

export const HEALTH_BADGE: Record<string, { variant: BadgeVariant; label: string }> = {
  ON_TRACK: { variant: 'success', label: 'Sur la bonne voie' },
  AT_RISK: { variant: 'warning', label: 'À risque' },
  OFF_TRACK: { variant: 'danger', label: 'En retard' },
};
