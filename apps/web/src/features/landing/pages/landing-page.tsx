import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Brain, Kanban, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { HeroPreview } from '../components/hero-preview';

const PILLARS = [
  {
    icon: Kanban,
    title: 'Kanban & projets',
    description: 'Organisez vos tâches, suivez l\'avancement et gardez l\'équipe alignée.',
  },
  {
    icon: Sparkles,
    title: 'Copilote PM',
    description: 'User Stories, risques et rapports de statut — générés par l\'IA, exportables en projet.',
  },
  {
    icon: Brain,
    title: 'Daily Brief',
    description: 'Chaque matin : priorités, réunions et tâches en retard en un coup d\'œil.',
  },
];

const STEPS = [
  { step: '1', title: 'Créez votre workspace', description: 'Inscription gratuite, sans carte bancaire.' },
  { step: '2', title: 'Structurez un projet', description: 'Kanban ou assistant IA pour démarrer.' },
  { step: '3', title: 'Pilotez au quotidien', description: 'Daily Brief et tableau de bord.' },
];

function SectionContainer({
  children,
  className,
  narrow,
}: {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 sm:px-6',
        narrow ? 'max-w-3xl' : 'max-w-6xl',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[520px] w-[min(800px,100vw)] -translate-x-1/2 rounded-full bg-accent/8 blur-[120px]" />
      </div>

      <header className="sticky top-0 z-50 glass">
        <SectionContainer className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="group flex shrink-0 items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-br from-accent to-accent-hover shadow-sm transition-transform group-hover:scale-105">
              <span className="text-sm font-bold text-accent-foreground">WP</span>
            </div>
            <span className="font-display font-semibold">WorkPilot</span>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle className="hidden sm:flex" />
            <Link to="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                Connexion
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">
                Commencer
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </SectionContainer>
      </header>

      <main>
        {/* Hero */}
        <section className="pb-20 pt-12 md:pb-28 md:pt-20">
          <SectionContainer>
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="flex flex-col lg:max-w-xl"
              >
                <Badge variant="accent" className="mb-5 w-fit">
                  <Sparkles className="h-3 w-3" />
                  Pour les chefs de projet
                </Badge>

                <h1 className="text-balance font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
                  Pilotez vos projets.{' '}
                  <span className="bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent">
                    L&apos;IA fait le reste.
                  </span>
                </h1>

                <p className="mt-5 max-w-lg text-pretty text-lg leading-relaxed text-muted">
                  WorkPilot combine Kanban, copilote PM et Daily Brief — une seule app pour structurer,
                  avancer et garder la visibilité.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link to="/register" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full shadow-md sm:w-auto">
                      Créer un workspace gratuit
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>

                <p className="mt-4 text-sm text-muted">
                  Sans carte bancaire · Setup en 2 min ·{' '}
                  <Link to="/login" className="text-accent hover:underline">
                    Déjà un compte ?
                  </Link>
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="w-full min-w-0"
              >
                <HeroPreview />
              </motion.div>
            </div>
          </SectionContainer>
        </section>

        {/* 3 piliers */}
        <section id="features" className="scroll-mt-20 border-t border-border/60 bg-surface-sunken/30 py-16 md:py-20">
          <SectionContainer>
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                L&apos;essentiel, rien de plus
              </h2>
              <p className="mt-3 text-muted">
                Trois briques pour couvrir le cycle complet d&apos;un projet.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3 md:gap-6">
              {PILLARS.map((pillar, i) => (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-[var(--radius-xl)] border border-border/80 bg-surface-elevated p-6 shadow-[var(--shadow-sm)]"
                >
                  <div className="mb-4 inline-flex rounded-[var(--radius-lg)] bg-accent/10 p-3">
                    <pillar.icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="mb-2 font-display text-lg font-semibold">{pillar.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{pillar.description}</p>
                </motion.div>
              ))}
            </div>
          </SectionContainer>
        </section>

        {/* Comment ça marche — compact */}
        <section className="py-16 md:py-20">
          <SectionContainer narrow>
            <h2 className="mb-8 text-center font-display text-2xl font-bold tracking-tight">
              Opérationnel en 5 minutes
            </h2>
            <ol className="space-y-6">
              {STEPS.map((step, i) => (
                <motion.li
                  key={step.step}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="flex gap-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 font-display text-sm font-bold text-accent">
                    {step.step}
                  </span>
                  <div>
                    <p className="font-semibold">{step.title}</p>
                    <p className="mt-0.5 text-sm text-muted">{step.description}</p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </SectionContainer>
        </section>

        {/* CTA final */}
        <section className="pb-20 md:pb-24">
          <SectionContainer narrow>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="rounded-[var(--radius-2xl)] bg-gradient-to-br from-accent to-accent-hover px-6 py-12 text-center sm:px-10"
            >
              <h2 className="font-display text-2xl font-bold text-accent-foreground md:text-3xl">
                Prêt à essayer ?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-accent-foreground/85">
                Créez votre workspace gratuitement et structurez votre premier projet dès aujourd&apos;hui.
              </p>
              <Link to="/register" className="mt-6 inline-block">
                <Button
                  size="lg"
                  className="border-0 bg-white text-accent shadow-lg hover:bg-white/90"
                >
                  Commencer
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </SectionContainer>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <SectionContainer className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-accent to-accent-hover">
              <span className="text-[10px] font-bold text-accent-foreground">WP</span>
            </div>
            <span className="font-display text-sm font-semibold">WorkPilot</span>
          </div>
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} WorkPilot ·{' '}
            <Link to="/login" className="hover:text-foreground">
              Connexion
            </Link>
          </p>
        </SectionContainer>
      </footer>
    </div>
  );
}
