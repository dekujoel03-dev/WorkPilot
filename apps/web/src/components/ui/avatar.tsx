import { cn, getInitials } from '@/lib/utils';

const sizes = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
} as const;

export function Avatar({
  firstName,
  lastName,
  size = 'md',
  className,
}: {
  firstName: string;
  lastName: string;
  size?: keyof typeof sizes;
  className?: string;
  color?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-full bg-accent/15 text-accent flex items-center justify-center font-semibold shrink-0 ring-2 ring-surface',
        sizes[size],
        className,
      )}
      title={`${firstName} ${lastName}`}
    >
      {getInitials(firstName, lastName)}
    </div>
  );
}

export function AvatarStack({
  users,
  max = 3,
  size = 'sm',
}: {
  users: { firstName: string; lastName: string }[];
  max?: number;
  size?: keyof typeof sizes;
}) {
  const visible = users.slice(0, max);
  const extra = users.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((u, i) => (
        <Avatar
          key={`${u.firstName}-${i}`}
          firstName={u.firstName}
          lastName={u.lastName}
          size={size}
        />
      ))}
      {extra > 0 && (
        <div
          className={cn(
            'rounded-full bg-surface-hover border border-border flex items-center justify-center font-medium text-muted ring-2 ring-surface',
            sizes[size],
          )}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}
