import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, Copy, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth.store';
import { getInitials } from '@/lib/utils';
import {
  useWorkspaceMembers,
  useWorkspaceInvites,
  useCreateInvite,
  useRevokeInvite,
} from '../hooks/use-team';

const ROLES = [
  { value: 'MEMBER', label: 'Membre' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'GUEST', label: 'Invité' },
] as const;

function canManageTeam(role?: string) {
  return role === 'OWNER' || role === 'ADMIN';
}

export function TeamPage() {
  const workspace = useAuthStore((s) => s.workspace);
  const isAdmin = canManageTeam(workspace?.role);
  const { data: membersData, isLoading: membersLoading } = useWorkspaceMembers();
  const { data: invitesData } = useWorkspaceInvites(isAdmin);
  const createInvite = useCreateInvite();
  const revokeInvite = useRevokeInvite();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'MEMBER' | 'ADMIN' | 'GUEST'>('MEMBER');
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const members = membersData?.data ?? [];
  const invites = invitesData?.data ?? [];

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    const result = await createInvite.mutateAsync({ email: email.trim(), role });
    const url = `${window.location.origin}${result.data.inviteUrl}`;
    setLastInviteUrl(url);
    setEmail('');
    setCopied(false);
  };

  const copyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-accent" />
          <div>
            <h1 className="text-xl font-semibold">Équipe</h1>
            <p className="text-sm text-muted">
              Membres de {workspace?.name ?? 'votre workspace'} — partagez aussi des projets individuels
            </p>
          </div>
        </div>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Membres ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {membersLoading && (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-12 bg-surface-hover animate-pulse rounded-[var(--radius-md)]" />
              ))}
            </div>
          )}
          <ul className="space-y-3">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border px-4 py-3"
              >
                <div className="h-9 w-9 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent">
                  {getInitials(member.user.firstName, member.user.lastName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {member.user.firstName} {member.user.lastName}
                  </p>
                  <p className="text-xs text-muted truncate">{member.user.email}</p>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted px-2 py-0.5 rounded border border-border">
                  {member.role}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Inviter un collègue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted">
              Compte existant → notification dans la cloche (accepter en un clic). Nouveau compte → lien
              d'invitation à partager.
            </p>
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="collegue@entreprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                required
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
                className="h-10 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <Button type="submit" loading={createInvite.isPending}>
                Inviter
              </Button>
            </form>

            {lastInviteUrl && (
              <div className="rounded-[var(--radius-md)] border border-accent/30 bg-accent/5 p-3 space-y-2">
                <p className="text-sm font-medium">Lien d'invitation créé</p>
                <p className="text-xs text-muted break-all">{lastInviteUrl}</p>
                <Button size="sm" variant="secondary" onClick={() => copyLink(lastInviteUrl)}>
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copié !' : 'Copier le lien'}
                </Button>
              </div>
            )}

            {invites.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  En attente
                </p>
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between gap-3 text-sm rounded-[var(--radius-md)] bg-surface-hover px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Mail className="h-4 w-4 text-muted shrink-0" />
                      <span className="truncate">{invite.email}</span>
                      <span className="text-xs text-muted">{invite.role}</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          copyLink(`${window.location.origin}${invite.inviteUrl}`)
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => revokeInvite.mutate(invite.id)}
                        loading={revokeInvite.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!isAdmin && (
        <p className="text-sm text-muted text-center">
          Seuls les admins peuvent inviter de nouveaux membres.
        </p>
      )}
    </div>
  );
}
