import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { login } from '@/features/auth/api/auth.api';
import { useAuthStore, getLastWorkspaceId } from '@/stores/auth.store';
import { ApiError } from '@/lib/api';
import { getSafeRedirect } from '@/lib/redirect';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@workpilot.test', password: 'Test1234!' },
  { label: 'Membre', email: 'member@workpilot.test', password: 'Test1234!' },
  { label: 'Invité', email: 'guest@workpilot.test', password: 'Test1234!' },
] as const;

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = getSafeRedirect(searchParams);
  const setSession = useAuthStore((s) => s.setSession);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const lastWorkspaceId = getLastWorkspaceId();
      const response = await login({
        ...form,
        ...(lastWorkspaceId ? { workspaceId: lastWorkspaceId } : {}),
      });
      setSession({
        user: response.data.user,
        workspace: response.data.workspace,
        accessToken: response.data.tokens.accessToken,
      });
      navigate(redirectTo ?? '/app');
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Connexion impossible',
      );
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email: string, password: string) => {
    setForm({ email, password });
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between p-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-[var(--radius-md)] bg-accent flex items-center justify-center">
            <span className="text-accent-foreground font-bold text-sm">WP</span>
          </div>
          <span className="font-semibold">WorkPilot</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader>
              <CardTitle>Connexion</CardTitle>
              <CardDescription>Accédez à votre workspace intelligent</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="vous@entreprise.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <Input
                  label="Mot de passe"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                {error && (
                  <p className="text-sm text-danger bg-danger/10 px-3 py-2 rounded-[var(--radius-md)]">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" loading={loading}>
                  Se connecter
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted">
                Pas encore de compte ?{' '}
                <Link
                  to={redirectTo ? `/register?redirect=${encodeURIComponent(redirectTo)}` : '/register'}
                  className="text-accent hover:underline font-medium"
                >
                  Créer un workspace
                </Link>
              </p>

              {import.meta.env.DEV && (
                <div className="mt-6 rounded-[var(--radius-lg)] border border-dashed border-border bg-surface-sunken/60 p-4">
                  <p className="text-xs font-medium text-muted mb-3">
                    Comptes démo — <code className="text-foreground">pnpm db:seed</code>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {DEMO_ACCOUNTS.map((account) => (
                      <button
                        key={account.email}
                        type="button"
                        onClick={() => fillDemo(account.email, account.password)}
                        className="rounded-[var(--radius-md)] border border-border bg-surface px-2.5 py-1.5 text-xs font-medium hover:border-accent/40 hover:bg-accent/5 transition-colors"
                      >
                        {account.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-muted">Mot de passe : Test1234!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
