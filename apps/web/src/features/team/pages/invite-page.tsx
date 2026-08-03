import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { Logo } from '@/components/logo';
import { useAuthStore } from '@/stores/auth.store';
import { useInvitePreview, useAcceptInvite } from '@/features/team/hooks/use-team';
import { ApiError } from '@/lib/api';

export function InvitePage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const { user, setSession } = useAuthStore();
  const { data, isLoading, error } = useInvitePreview(token);
  const acceptInvite = useAcceptInvite();

  const preview = data?.data;
  const isLoggedIn = !!user;

  const handleAccept = async () => {
    if (!user) return;
    const result = await acceptInvite.mutateAsync(token);
    setSession({
      user,
      workspace: { ...result.data.workspace, role: preview?.role },
      accessToken: result.data.tokens.accessToken,
    });
    navigate('/app');
  };

  const registerHref = `/register?invite=${token}${preview ? `&email=${encodeURIComponent(preview.email)}` : ''}`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between p-6">
        <Logo variant="banner" />
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                Invitation workspace
              </CardTitle>
              <CardDescription>
                {isLoading && 'Chargement…'}
                {preview && `Rejoignez ${preview.workspace.name}${preview.project ? ` — projet « ${preview.project.name} »` : ''} en tant que ${preview.projectRole ?? preview.role}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <p className="text-sm text-destructive">
                  {error instanceof ApiError ? error.message : 'Invitation invalide'}
                </p>
              )}

              {preview && (
                <>
                  <p className="text-sm text-muted">
                    Invitation pour <strong className="text-foreground">{preview.email}</strong>
                  </p>

                  {isLoggedIn ? (
                    user.email.toLowerCase() === preview.email.toLowerCase() ? (
                      <Button className="w-full" onClick={handleAccept} loading={acceptInvite.isPending}>
                        Rejoindre {preview.workspace.name}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <p className="text-sm text-destructive">
                        Connecté en tant que {user.email}. Déconnectez-vous et reconnectez-vous avec{' '}
                        {preview.email}.
                      </p>
                    )
                  ) : (
                    <div className="space-y-2">
                      <Link to={`/login?redirect=/invite/${token}`}>
                        <Button className="w-full" variant="secondary">
                          Se connecter pour accepter
                        </Button>
                      </Link>
                      <Link to={registerHref}>
                        <Button className="w-full">
                          Créer un compte et rejoindre
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
