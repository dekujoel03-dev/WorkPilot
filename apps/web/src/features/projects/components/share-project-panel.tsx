import { useState, useEffect, useRef } from 'react';
import { Share2, UserPlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getInitials } from '@/lib/utils';
import type { ProjectRole } from '@work-pilot/shared';
import {
  useProjectMembers,
  useAddProjectMember,
  useUpdateProjectMemberRole,
  useRemoveProjectMember,
} from '../hooks/use-project-members';

const ROLE_LABELS: Record<ProjectRole, string> = {
  VIEWER: 'Lecteur',
  EDITOR: 'Éditeur',
  ADMIN: 'Admin',
};

const ROLES: ProjectRole[] = ['VIEWER', 'EDITOR', 'ADMIN'];

interface ShareProjectPanelProps {
  projectId: string;
}

export function ShareProjectPanel({ projectId }: ShareProjectPanelProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ProjectRole>('EDITOR');
  const [message, setMessage] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const { data } = useProjectMembers(projectId);
  const addMember = useAddProjectMember(projectId);
  const updateRole = useUpdateProjectMemberRole(projectId);
  const removeMember = useRemoveProjectMember(projectId);

  const members = data?.data ?? [];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setMessage(null);
    try {
      const result = await addMember.mutateAsync({ email: email.trim(), role });
      setEmail('');
      if ('pending' in result.data && result.data.pending) {
        const inviteUrl = `${window.location.origin}${result.data.inviteUrl}`;
        setMessage(`${result.data.message} Lien : ${inviteUrl}`);
      } else {
        setMessage('Accès accordé — la personne verra le projet dans ses notifications.');
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur');
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <Button size="sm" variant="secondary" onClick={() => setOpen((v) => !v)}>
        <Share2 className="h-4 w-4" />
        Partager
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-30 w-80 rounded-[var(--radius-lg)] border border-border bg-surface shadow-lg p-4 space-y-4">
          <div>
            <p className="text-sm font-semibold">Partager le projet</p>
            <p className="text-xs text-muted mt-0.5">
              Compte existant → notification · Nouveau → invitation automatique
            </p>
          </div>

          <form onSubmit={handleAdd} className="space-y-2">
            <Input
              type="email"
              placeholder="email@entreprise.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as ProjectRole)}
              className="w-full h-10 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm" className="w-full" loading={addMember.isPending}>
              <UserPlus className="h-4 w-4" />
              Ajouter
            </Button>
          </form>

          {message && <p className="text-xs text-muted">{message}</p>}

          {members.length > 0 && (
            <ul className="space-y-2 pt-2 border-t border-border max-h-40 overflow-y-auto">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-2 text-sm">
                  <div className="h-7 w-7 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-medium text-accent shrink-0">
                    {getInitials(m.user.firstName, m.user.lastName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-xs">
                      {m.user.firstName} {m.user.lastName}
                    </p>
                    <p className="truncate text-[10px] text-muted">{m.user.email}</p>
                  </div>
                  <select
                    value={m.role}
                    onChange={(e) =>
                      updateRole.mutate({ memberId: m.id, role: e.target.value as ProjectRole })
                    }
                    className="text-[10px] h-7 rounded border border-border bg-surface px-1"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeMember.mutate(m.id)}
                    className="p-1 text-muted hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
