import { useState, type FormEvent, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { Logo } from '@/components/logo';
import { register } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { ApiError } from '@/lib/api';
import { getSafeRedirect } from '@/lib/redirect';

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite') ?? undefined;
  const prefilledEmail = searchParams.get('email') ?? '';
  const redirectTo = getSafeRedirect(searchParams);
  const setSession = useAuthStore((s) => s.setSession);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailConfirmationSent, setEmailConfirmationSent] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: prefilledEmail,
    password: '',
    workspaceName: '',
  });

  useEffect(() => {
    if (prefilledEmail) {
      setForm((f) => ({ ...f, email: prefilledEmail }));
    }
  }, [prefilledEmail]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await register({
        ...form,
        inviteToken,
        workspaceName: inviteToken ? undefined : form.workspaceName,
      });

      if ('needsEmailConfirmation' in response.data && response.data.needsEmailConfirmation) {
        setEmailConfirmationSent(response.data.email);
        return;
      }

      setSession({
        user: response.data.user,
        workspace: response.data.workspace,
        accessToken: response.data.tokens.accessToken,
      });
      navigate(redirectTo ?? (inviteToken ? `/invite/${inviteToken}` : '/app'));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Inscription impossible',
      );
    } finally {
      setLoading(false);
    }
  };

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
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader>
              <CardTitle>
                {inviteToken ? 'Rejoindre un workspace' : 'Créer votre workspace'}
              </CardTitle>
              <CardDescription>
                {inviteToken
                  ? 'Créez votre compte pour accepter l\'invitation'
                  : 'Commencez gratuitement en quelques secondes'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {emailConfirmationSent ? (
                <div className="space-y-4 text-center">
                  <p className="text-sm text-muted">
                    Un email de confirmation a été envoyé à{' '}
                    <span className="font-medium text-foreground">{emailConfirmationSent}</span>.
                  </p>
                  <p className="text-sm text-muted">
                    Cliquez sur le lien dans l&apos;email, puis connectez-vous pour accéder à votre
                    workspace.
                  </p>
                  <Link to="/login">
                    <Button className="w-full">
                      Se connecter
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Prénom"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    required
                  />
                  <Input
                    label="Nom"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    required
                  />
                </div>
                <Input
                  label="Email professionnel"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <Input
                  label="Mot de passe"
                  type="password"
                  placeholder="Min. 8 caractères, majuscule + chiffre"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                {!inviteToken && (
                  <Input
                    label="Nom du workspace"
                    placeholder="Acme Corp"
                    value={form.workspaceName}
                    onChange={(e) => setForm({ ...form, workspaceName: e.target.value })}
                    required
                  />
                )}
                {error && (
                  <p className="text-sm text-danger bg-danger/10 px-3 py-2 rounded-[var(--radius-md)]">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" loading={loading}>
                  {inviteToken ? 'Rejoindre le workspace' : 'Créer mon workspace'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
              )}
              {!emailConfirmationSent && (
              <p className="mt-6 text-center text-sm text-muted">
                Déjà un compte ?{' '}
                <Link to="/login" className="text-accent hover:underline font-medium">
                  Se connecter
                </Link>
              </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
