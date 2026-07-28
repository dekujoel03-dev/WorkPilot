import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePendingInvites } from '@/features/team/hooks/use-team';

export function PendingInvitesBanner() {
  const { data } = usePendingInvites();
  const invites = data?.data ?? [];

  if (invites.length === 0) return null;

  const invite = invites[0];

  return (
    <div className="mx-6 mt-4 rounded-[var(--radius-md)] border border-accent/30 bg-accent/5 px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <Mail className="h-4 w-4 text-accent shrink-0" />
        <p className="text-sm truncate">
          Invitation à rejoindre <strong>{invite.workspace?.name}</strong>
        </p>
      </div>
      <Link to={`/invite/${invite.token}`}>
        <Button size="sm">Voir</Button>
      </Link>
    </div>
  );
}
