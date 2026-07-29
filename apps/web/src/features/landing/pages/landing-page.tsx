import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Brain, Kanban, ChevronRight, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { HeroPreview } from '../components/hero-preview';

const CONTACT = {
  email: 'dekujoel03@gmail.com',
  phone: '+228 96613591',
};

const PILLARS = [
  {
    icon: Kanban,
    title: 'Kanban & projets',
    description: 'Organisez vos tâches, suivez l\'avancement et gardez l\'équipe alignée.',
  },
  {
    icon: Sparkles,
    title: 'Assistant projet',
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

function ConteneurSection({
  children,
  className,
  etroit,
}: {
  children: React.ReactNode;
  className?: string;
  etroit?: boolean;
}) {
  return (
    <div className={cn('conteneur-section', etroit && 'conteneur-section--etroit', className)}>
      {children}
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="page-accueil">
      <div className="decoration-arriere-plan">
        <div className="halo-lumiere" />
      </div>

      <header className="en-tete-accueil">
        <ConteneurSection className="en-tete-contenu">
          <Link to="/" className="lien-logo">
            <div className="icone-logo">
              <span className="initiales-logo">WP</span>
            </div>
            <span className="nom-marque">WorkPilot</span>
          </Link>

          <div className="actions-en-tete">
            <ThemeToggle className="interrupteur-theme" />
            <Link to="/login" className="bouton-connexion-mobile">
              <Button variant="ghost" size="sm">
                Connexion
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">
                Commencer
                <ArrowRight className="icone-moyenne" />
              </Button>
            </Link>
          </div>
        </ConteneurSection>
      </header>

      <main>
        <section className="section-hero">
          <ConteneurSection>
            <div className="hero-grille">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="hero-colonne-texte"
              >
                <Badge variant="accent" className="badge-accroche">
                  <Sparkles className="icone-tres-petite" />
                  Pour les innovateurs
                </Badge>

                <h1 className="titre-principal">
                  Pilotez vos projets.{' '}
                  <span className="titre-en-accent">
                    L&apos;IA Vous aide.
                  </span>
                </h1>

                <p className="description-hero">
                  WorkPilot combine Kanban, copilote PM et Daily Brief — une seule app pour structurer,
                  avancer et garder la visibilité.
                </p>

                <div className="boutons-hero">
                  <Link to="/register" className="lien-inscription-hero">
                    <Button size="lg" className="bouton-principal-hero">
                      Créer un workspace gratuit
                      <ArrowRight className="icone-grande" />
                    </Button>
                  </Link>
                </div>

                <p className="note-inscription">
                  Sans carte bancaire · Setup en 2 min ·{' '}
                  <Link to="/login" className="lien-compte-existant">
                    Déjà un compte ?
                  </Link>
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="hero-colonne-apercu"
              >
                <HeroPreview />
              </motion.div>
            </div>
          </ConteneurSection>
        </section>

        <section id="features" className="section-fonctionnalites">
          <ConteneurSection>
            <div className="intro-fonctionnalites">
              <h2 className="titre-section">
                L&apos;essentiel, rien de plus
              </h2>
              <p className="texte-intro-section">
                Trois briques pour couvrir le cycle complet d&apos;un projet.
              </p>
            </div>

            <div className="grille-piliers">
              {PILLARS.map((pillar, i) => (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="carte-pilier"
                >
                  <div className="icone-pilier">
                    <pillar.icon className="icone-grande icone-accent" />
                  </div>
                  <h3 className="titre-pilier">{pillar.title}</h3>
                  <p className="description-pilier">{pillar.description}</p>
                </motion.div>
              ))}
            </div>
          </ConteneurSection>
        </section>

        <section className="section-etapes">
          <ConteneurSection etroit>
            <h2 className="titre-etapes">
              Opérationnel en 5 minutes
            </h2>
            <ol className="liste-etapes">
              {STEPS.map((step, i) => (
                <motion.li
                  key={step.step}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="item-etape"
                >
                  <span className="numero-etape">
                    {step.step}
                  </span>
                  <div>
                    <p className="titre-etape">{step.title}</p>
                    <p className="description-etape">{step.description}</p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </ConteneurSection>
        </section>

        <section className="section-appel-action">
          <ConteneurSection etroit>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bloc-appel-action"
            >
              <h2 className="titre-appel-action">
                Prêt à essayer ?
              </h2>
              <p className="texte-appel-action">
                Créez votre workspace gratuitement et structurez votre premier projet dès aujourd&apos;hui.
              </p>
              <Link to="/register" className="lien-appel-action">
                <Button size="lg" className="bouton-appel-action">
                  Commencer
                  <ChevronRight className="icone-grande" />
                </Button>
              </Link>
            </motion.div>
          </ConteneurSection>
        </section>
      </main>

      <footer className="pied-de-page">
        <ConteneurSection className="pied-de-page-contenu">
          <div className="marque-pied-de-page">
            <div className="icone-pied-de-page">
              <span className="initiales-pied-de-page">WP</span>
            </div>
            <span className="nom-pied-de-page">WorkPilot</span>
          </div>

          <div className="contact-pied-de-page">
            <a href={`mailto:${CONTACT.email}`} className="item-contact">
              <Mail className="icone-tres-petite icone-accent" />
              {CONTACT.email}
            </a>
            <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`} className="item-contact">
              <Phone className="icone-tres-petite icone-accent" />
              {CONTACT.phone}
            </a>
          </div>

          <p className="copyright">
            © {new Date().getFullYear()} WorkPilot ·{' '}
            <Link to="/login" className="lien-pied-de-page">
              Connexion
            </Link>
          </p>
        </ConteneurSection>
      </footer>
    </div>
  );
}
