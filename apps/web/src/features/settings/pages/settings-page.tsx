import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Webhook,
  Trash2,
  Plus,
  Copy,
  Building2,
  Palette,
  Shield,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';
import { toast } from '@/stores/toast.store';
import {
  useAIStatus,
  useWebhooks,
  useCreateWebhook,
  useDeleteWebhook,
} from '../hooks/use-settings';

const WEBHOOK_EVENTS = [
  { value: 'project.created', label: 'project.created', hint: 'Nouveau projet' },
  { value: 'task.updated', label: 'task.updated', hint: 'Tâche modifiée' },
  { value: '*', label: '* (tous)', hint: 'Tous les événements' },
] as const;

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Propriétaire',
  ADMIN: 'Administrateur',
  MEMBER: 'Membre',
  GUEST: 'Invité',
};

const NAV = [
  { id: 'workspace', label: 'Workspace', icon: Building2 },
  { id: 'appearance', label: 'Apparence', icon: Palette },
  { id: 'ai', label: 'Intelligence IA', icon: Sparkles },
  { id: 'integrations', label: 'Intégrations', icon: Webhook },
] as const;

type SectionId = (typeof NAV)[number]['id'];

export function SettingsPage() {
  const { user, workspace } = useAuthStore();
  const isAdmin = workspace?.role === 'OWNER' || workspace?.role === 'ADMIN';
  const [activeSection, setActiveSection] = useState<SectionId>('workspace');

  const { data: aiStatus, isLoading: aiLoading } = useAIStatus();
  const { data: webhooksData, isLoading: webhooksLoading } = useWebhooks();
  const createWebhook = useCreateWebhook();
  const deleteWebhook = useDeleteWebhook();

  const [url, setUrl] = useState('');
  const [event, setEvent] = useState<string>('project.created');
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const ai = aiStatus?.data;
  const webhooks = webhooksData?.data ?? [];

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    try {
      const result = await createWebhook.mutateAsync({ url: url.trim(), events: [event] });
      setNewSecret(result.data.secret ?? null);
      setUrl('');
      toast('Webhook créé avec succès', 'success');
    } catch {
      toast('Impossible de créer le webhook', 'error');
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await deleteWebhook.mutateAsync(id);
      toast('Webhook supprimé', 'success');
    } catch {
      toast('Suppression impossible', 'error');
    }
  };

  const copySecret = async (secret: string) => {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    toast('Secret copié', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollTo = (id: SectionId) => {
    setActiveSection(id);
    document.getElementById(`settings-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold tracking-tight font-display">Paramètres</h1>
        <p className="text-sm text-muted mt-1">
          Configuration du workspace <span className="text-foreground font-medium">{workspace?.name}</span>
        </p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Navigation latérale */}
        <nav className="lg:w-52 shrink-0">
          <ul className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 lg:sticky lg:top-6">
            {NAV.map((item) => {
              if (item.id === 'integrations' && !isAdmin) return null;
              const Icon = item.icon;
              return (
                <li key={item.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => scrollTo(item.id)}
                    className={cn(
                      'flex items-center gap-2.5 w-full rounded-[var(--radius-lg)] px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
                      activeSection === item.id
                        ? 'bg-accent/10 text-accent'
                        : 'text-muted hover:text-foreground hover:bg-surface-hover',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Contenu */}
        <div className="flex-1 min-w-0 space-y-10">
          {/* Workspace */}
          <SettingsSection
            id="workspace"
            title="Workspace"
            description="Informations générales et accès à votre espace de travail."
          >
            <SettingRow label="Nom" description="Identifiant visible par toute l'équipe">
              <span className="text-sm font-medium">{workspace?.name ?? '—'}</span>
            </SettingRow>
            <SettingRow label="Slug" description="URL interne du workspace">
              <code className="text-xs bg-surface-sunken px-2 py-1 rounded-[var(--radius-sm)] border border-border">
                {workspace?.slug ?? '—'}
              </code>
            </SettingRow>
            <SettingRow label="Votre rôle" description="Niveau d'accès dans ce workspace">
              <Badge variant={workspace?.role === 'OWNER' ? 'accent' : 'default'}>
                <Shield className="h-3 w-3" />
                {ROLE_LABELS[workspace?.role ?? ''] ?? workspace?.role ?? '—'}
              </Badge>
            </SettingRow>
            {user && (
              <SettingRow label="Compte connecté" description={user.email}>
                <div className="flex items-center gap-2.5">
                  <Avatar firstName={user.firstName} lastName={user.lastName} size="sm" />
                  <span className="text-sm font-medium">
                    {user.firstName} {user.lastName}
                  </span>
                </div>
              </SettingRow>
            )}
            <SettingRow
              label="Gestion de l'équipe"
              description="Inviter des membres, gérer les rôles"
              border={false}
            >
              <Link to="/app/team">
                <Button variant="secondary" size="sm">
                  <Users className="h-4 w-4" />
                  Équipe
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </Button>
              </Link>
            </SettingRow>
          </SettingsSection>

          {/* Apparence */}
          <SettingsSection
            id="appearance"
            title="Apparence"
            description="Personnalisez l'interface selon vos préférences."
          >
            <SettingRow
              label="Thème"
              description="Clair, sombre ou synchronisé avec le système"
              border={false}
            >
              <ThemeToggle />
            </SettingRow>
          </SettingsSection>

          {/* IA */}
          <SettingsSection
            id="ai"
            title="Intelligence artificielle"
            description="Assistant, Daily Brief, découpage de projets et analyse de risques."
          >
            {aiLoading ? (
              <div className="p-5 space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <>
                <SettingRow label="Statut" description="Provider LLM actuellement actif">
                  <div className="flex items-center gap-2">
                    {ai?.provider === 'mock' ? (
                      <Badge variant="warning">
                        <AlertCircle className="h-3 w-3" />
                        Mode démo
                      </Badge>
                    ) : (
                      <Badge variant="success">
                        <CheckCircle2 className="h-3 w-3" />
                        {ai?.provider === 'mistral'
                          ? 'Mistral connecté'
                          : ai?.provider === 'ollama'
                            ? 'Ollama connecté'
                            : 'OpenAI connecté'}
                      </Badge>
                    )}
                  </div>
                </SettingRow>
                <SettingRow label="Provider" description="Moteur utilisé pour les réponses IA">
                  <span className="text-sm font-medium">{ai?.label ?? '—'}</span>
                </SettingRow>
                {ai?.model && (
                  <SettingRow
                    label="Modèle"
                    description={
                      ai?.provider === 'mistral'
                        ? 'Modèle Mistral cloud'
                        : ai?.provider === 'ollama'
                          ? 'Modèle Ollama local'
                          : 'Version du modèle OpenAI'
                    }
                  >
                    <code className="text-xs bg-surface-sunken px-2 py-1 rounded-[var(--radius-sm)] border border-border">
                      {ai.model}
                    </code>
                  </SettingRow>
                )}
                <SettingRow
                  label="Fonctionnalités"
                  description="Disponibles selon le provider configuré"
                  border={false}
                >
                  <div className="flex flex-wrap gap-1.5 justify-end max-w-xs">
                    {['Assistant', 'Daily Brief', 'Découpage projet', 'Analyse risque'].map(
                      (f) => (
                        <Badge key={f} variant="outline">
                          {f}
                        </Badge>
                      ),
                    )}
                  </div>
                </SettingRow>

                {ai?.provider === 'mock' && (
                  <div className="mx-5 mb-5 rounded-[var(--radius-lg)] border border-border bg-surface-sunken/80 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-border bg-surface-hover/50">
                      <p className="text-xs font-medium text-muted">
                        Activer Mistral (recommandé), OpenAI ou Ollama — <code className="text-foreground">apps/api/.env</code>
                      </p>
                    </div>
                    <pre className="p-4 text-xs font-mono text-foreground/90 overflow-x-auto leading-relaxed">
{`# Mistral cloud (défaut)
AI_PROVIDER=mistral
MISTRAL_API_KEY=votre-cle-api
MISTRAL_MODEL=mistral-small-latest

# Ou OpenAI cloud
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Ou Ollama local
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.2`}
                    </pre>
                  </div>
                )}
              </>
            )}
          </SettingsSection>

          {/* Intégrations — admin only */}
          {isAdmin && (
            <SettingsSection
              id="integrations"
              title="Webhooks"
              description="Recevez les événements WorkPilot sur vos endpoints externes en temps réel."
            >
              <div className="px-5 py-4 border-b border-border bg-surface-sunken/30">
                <p className="text-xs text-muted leading-relaxed">
                  Chaque requête inclut les en-têtes{' '}
                  <code className="text-foreground bg-surface px-1 py-0.5 rounded text-[10px]">
                    X-WorkPilot-Event
                  </code>{' '}
                  et{' '}
                  <code className="text-foreground bg-surface px-1 py-0.5 rounded text-[10px]">
                    X-WorkPilot-Signature
                  </code>{' '}
                  (HMAC-SHA256). Vérifiez la signature avec votre secret webhook.
                </p>
              </div>

              <form onSubmit={handleCreateWebhook} className="p-5 space-y-4 border-b border-border">
                <p className="text-sm font-medium font-display">Nouveau webhook</p>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                  <Input
                    type="url"
                    label="URL de destination"
                    placeholder="https://api.example.com/webhooks/work-pilot"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                  <Select
                    label="Événement"
                    value={event}
                    onChange={(e) => setEvent(e.target.value)}
                    className="sm:min-w-[160px]"
                  >
                    {WEBHOOK_EVENTS.map((ev) => (
                      <option key={ev.value} value={ev.value}>
                        {ev.label}
                      </option>
                    ))}
                  </Select>
                  <div className="flex items-end">
                    <Button type="submit" loading={createWebhook.isPending} className="w-full sm:w-auto">
                      <Plus className="h-4 w-4" />
                      Ajouter
                    </Button>
                  </div>
                </div>
              </form>

              {newSecret && (
                <div className="mx-5 mt-4 rounded-[var(--radius-lg)] border border-accent/30 bg-accent/5 p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Secret webhook — copiez-le maintenant</p>
                      <p className="text-xs text-muted mt-0.5">
                        Ce secret ne sera plus affiché après fermeture de cette page.
                      </p>
                    </div>
                  </div>
                  <code className="text-xs break-all block bg-surface/80 border border-border rounded-[var(--radius-md)] p-3 font-mono">
                    {newSecret}
                  </code>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => copySecret(newSecret)}>
                      <Copy className="h-3 w-3" />
                      {copied ? 'Copié' : 'Copier le secret'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setNewSecret(null)}>
                      Fermer
                    </Button>
                  </div>
                </div>
              )}

              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium font-display">
                    Webhooks actifs
                    {!webhooksLoading && (
                      <span className="text-muted font-normal ml-1.5">({webhooks.length})</span>
                    )}
                  </p>
                </div>

                {webhooksLoading && (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-16 rounded-[var(--radius-lg)]" />
                    ))}
                  </div>
                )}

                {!webhooksLoading && webhooks.length === 0 && (
                  <div className="text-center py-10 rounded-[var(--radius-lg)] border border-dashed border-border bg-surface-sunken/30">
                    <Webhook className="h-8 w-8 text-muted/40 mx-auto mb-3" />
                    <p className="text-sm font-medium">Aucun webhook configuré</p>
                    <p className="text-xs text-muted mt-1 max-w-xs mx-auto">
                      Connectez Slack, n8n, Zapier ou votre backend pour automatiser vos workflows.
                    </p>
                  </div>
                )}

                {!webhooksLoading && webhooks.length > 0 && (
                  <ul className="space-y-2">
                    {webhooks.map((hook) => (
                      <li
                        key={hook.id}
                        className="group flex items-start gap-4 rounded-[var(--radius-lg)] border border-border bg-surface-sunken/40 px-4 py-3.5 hover:border-border/80 hover:bg-surface-hover/50 transition-colors"
                      >
                        <div
                          className={cn(
                            'mt-1.5 h-2 w-2 rounded-full shrink-0',
                            hook.active ? 'bg-success' : 'bg-muted',
                          )}
                          title={hook.active ? 'Actif' : 'Inactif'}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate font-mono">{hook.url}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {hook.events.map((ev) => (
                              <Badge key={ev} variant="outline">
                                {ev}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-[11px] text-muted mt-2">
                            Créé le{' '}
                            {new Date(hook.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="opacity-60 group-hover:opacity-100 text-muted hover:text-destructive shrink-0"
                          onClick={() => handleDeleteWebhook(hook.id)}
                          loading={deleteWebhook.isPending}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </SettingsSection>
          )}

          {!isAdmin && (
            <p className="text-xs text-muted text-center pb-4">
              Seuls les administrateurs peuvent gérer les webhooks et intégrations.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={`settings-${id}`} className="scroll-mt-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold font-display">{title}</h2>
        <p className="text-sm text-muted mt-0.5">{description}</p>
      </div>
      <div className="rounded-[var(--radius-xl)] border border-border/80 bg-surface-elevated shadow-[var(--shadow-sm)] overflow-hidden divide-y divide-border">
        {children}
      </div>
    </section>
  );
}

function SettingRow({
  label,
  description,
  children,
  border = true,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  border?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4',
        !border && 'border-b-0',
      )}
    >
      <div className="min-w-0 sm:max-w-[55%]">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0 sm:text-right">{children}</div>
    </div>
  );
}
