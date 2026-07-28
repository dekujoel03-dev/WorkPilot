import { cn } from '@/lib/utils';

export function ProgressBar({
  value,
  className,
  color,
  size = 'md',
}: {
  value: number;
  className?: string;
  color?: string;
  size?: 'sm' | 'md';
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cn(
        'rounded-full bg-surface-sunken overflow-hidden',
        size === 'sm' ? 'h-1' : 'h-1.5',
        className,
      )}
    >
      <div
        className={cn(
          'h-full rounded-full bg-accent transition-all duration-700 ease-out',
          !color && 'bg-accent',
        )}
        style={{
          width: `${clamped}%`,
          ...(color ? { backgroundColor: color } : {}),
        }}
      />
    </div>
  );
}
