import {
  LayoutDashboard,
  FolderKanban,
  Sparkles,
  Bell,
  Search,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { ProgressBar } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function HeroPreview() {
  return (
    <div className="apercu-hero">
      <div className="apercu-halo" />

      <div className="apercu-fenetre">
        <div className="apercu-barre-fenetre">
          <div className="apercu-boutons-fenetre">
            <span className="apercu-bouton-fermer" />
            <span className="apercu-bouton-reduire" />
            <span className="apercu-bouton-agrandir" />
          </div>
          <div className="apercu-zone-recherche">
            <div className="apercu-champ-recherche">
              <Search className="icone-tres-petite icone-discrete" />
              <span className="apercu-texte-recherche">Rechercher…</span>
            </div>
          </div>
        </div>

        <div className="apercu-corps">
          <div className="apercu-menu-lateral">
            <div className="apercu-menu-entete">
              <div className="apercu-menu-logo">
                <span className="apercu-menu-initiales">WP</span>
              </div>
              <span className="apercu-menu-nom-espace">Acme</span>
            </div>
            {[
              { icon: LayoutDashboard, label: 'Dashboard', active: true },
              { icon: FolderKanban, label: 'Projets', active: false },
              { icon: Sparkles, label: 'Assistant IA', active: false },
            ].map((item) => (
              <div
                key={item.label}
                className={cn(
                  'apercu-item-menu',
                  item.active && 'apercu-item-menu--actif',
                )}
              >
                <item.icon className="icone-petite" />
                <span className="truncate">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="apercu-contenu">
            <div className="apercu-en-tete-dashboard">
              <div className="min-w-0">
                <p className="apercu-salutation">Bonjour, Alex</p>
                <p className="apercu-date">Lundi 27 juillet</p>
              </div>
              <div className="apercu-notifications">
                <Bell className="icone-petite icone-discrete" />
                <span className="apercu-pastille-notification" />
              </div>
            </div>

            <div className="apercu-brief-quotidien">
              <div className="apercu-brief-en-tete">
                <Sparkles className="icone-tres-petite icone-accent" />
                <span className="apercu-brief-titre">
                  Daily Brief
                </span>
              </div>
              <p className="apercu-brief-objectif">Objectif : finaliser la release v1</p>
              <ProgressBar value={72} size="sm" />
              <div className="apercu-brief-indicateurs">
                {[
                  { label: 'critiques', val: '3', icon: Zap },
                  { label: 'retards', val: '1', icon: AlertTriangle },
                ].map((s) => (
                  <div key={s.label} className="apercu-indicateur">
                    <s.icon className="icone-tres-petite icone-discrete" />
                    <span className="apercu-texte-indicateur">
                      {s.val} {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="apercu-grille-stats">
              {[
                { label: 'Projets', value: '6' },
                { label: 'Progression', value: '68%' },
                { label: 'Terminées', value: '24' },
              ].map((stat) => (
                <div key={stat.label} className="apercu-stat">
                  <p className="apercu-stat-label">{stat.label}</p>
                  <p className="apercu-stat-valeur">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="apercu-kanban">
              {[
                { name: 'À faire', tasks: ['Specs API'], color: '#71717A' },
                { name: 'En cours', tasks: ['Maquettes UI'], color: '#6366F1' },
                { name: 'Terminé', tasks: ['Setup repo'], color: '#22C55E', done: true },
              ].map((col) => (
                <div key={col.name} className="apercu-colonne-kanban">
                  <div className="apercu-colonne-en-tete">
                    <span
                      className="apercu-colonne-pastille"
                      style={{ backgroundColor: col.color }}
                    />
                    <span className="apercu-colonne-nom">{col.name}</span>
                  </div>
                  {col.tasks.map((t) => (
                    <div
                      key={t}
                      className={cn(
                        'apercu-tache',
                        col.done && 'apercu-tache--terminee',
                      )}
                    >
                      {t}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
