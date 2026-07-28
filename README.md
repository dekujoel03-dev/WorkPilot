# WorkPilot



**Workspace intelligent pour équipes qui veulent moins de clics et plus d'automatisation.**



> Philosophie : *Moins de clics. Plus d'automatisation.*



## Vision



WorkPilot est un SaaS premium de gestion de projets conçu pour réduire la charge mentale des équipes. Inspiré par la simplicité de Linear, la flexibilité de Notion et la puissance de ClickUp — sans leur complexité.



## Stack



| Couche | Technologies |

|--------|-------------|

| Frontend | React 19, TypeScript, Vite, TailwindCSS, Shadcn UI, React Query, React Router, Framer Motion |

| Backend | Node.js, NestJS, Prisma, JWT |

| Base de données | **Supabase** (PostgreSQL) |

| Fichiers | Supabase Storage |

| Cache | Redis (optionnel) |



## Structure monorepo



```

Work_Pilot/

├── apps/

│   ├── api/          # Backend NestJS

│   └── web/          # Frontend React

├── packages/

│   └── shared/       # Types partagés

└── docs/             # Architecture, setup

```



## Démarrage rapide

### Prérequis

- Node.js 20+
- pnpm 9+
- Compte [Supabase](https://supabase.com) (gratuit)

### Installation

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
# Configurer Supabase — voir docs/SETUP-SUPABASE.md
pnpm db:migrate
pnpm db:seed   # données de démo (optionnel)
pnpm dev
```

- **Frontend** : http://localhost:5173
- **API** : http://localhost:3000
- **API Docs** : http://localhost:3000/docs

Guide détaillé : [docs/SETUP-SUPABASE.md](./docs/SETUP-SUPABASE.md)

### Données de démo

```bash
pnpm db:seed   # enrichit le workspace existant
pnpm db:demo   # setup base + seed complet (première install)
```

| Compte | Email | Mot de passe | Rôle |
|--------|-------|--------------|------|
| Admin | `admin@workpilot.test` | `Test1234!` | Owner / Admin |
| Membre | `member@workpilot.test` | `Test1234!` | Member |
| Invité | `guest@workpilot.test` | `Test1234!` | Guest |

Contenu seedé : 6 projets (5 actifs + 1 archivé), tâches Kanban, commentaires, réunions, notifications, Daily Brief, jobs IA, webhook démo, invitation pending.



### Autres options base de données

- **PostgreSQL local** ou **Neon** — même schema Prisma, voir [SETUP-DATABASE.md](./docs/SETUP-DATABASE.md)



## Roadmap



| Phase | Focus | Statut |

|-------|-------|--------|

| **0** | Fondations (monorepo, auth, workspace) | ✅ Terminé |

| **1** | Core PM (projets, tâches, listes, statuts) | ✅ Terminé |

| **2** | Collaboration (commentaires, activités, notifications WS) | ✅ Terminé |

| **3** | Intelligence (Daily Brief, Smart Reminders, Focus Mode) | ✅ Terminé |

| **4** | Dashboard, recherche globale, calendrier | ✅ Terminé |

| **5** | Module IA (résumés, planification, assistant) | ✅ Terminé |

| **6** | Équipe, partage, archivage, OpenAI, webhooks | ✅ Terminé |



## Workflow projet



Guide complet du cycle de vie d'un projet (création → exécution → clôture) :

→ **[Workflow projet](./docs/PROJECT-WORKFLOW.md)** — actions utilisateur, automatisations IA, events, checklist



### IA — Ollama (défaut, local)

Au lancement de `pnpm dev`, Ollama s'installe et démarre automatiquement si absent (Windows : winget).

Dans `apps/api/.env` :

```env
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.2
```

Pour ignorer le bootstrap : `SKIP_OLLAMA_SETUP=true`

### OpenAI (option cloud)

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

Si Ollama/OpenAI est indisponible, l'API bascule en **mock** (réponses simulées). Statut dans **Paramètres** (`/app/settings`).

---

## Phase 6 — Équipe & intégrations

| Feature | Où | Notes |
|---------|-----|-------|
| Partage projet | Fiche projet → **Partager** | Email inconnu → invitation combinée workspace + projet |
| Invitations | `/invite/:token`, cloche | Accepter en un clic si compte existant |
| Archivage | Fiche projet, liste `?archived=true` | Restaurer depuis la même vue |
| OpenAI | `AI_PROVIDER=openai` | Fallback mock si erreur ou clé absente |
| Webhooks | `/app/settings` (admin) | Events `project.created`, `task.updated`, `*` ; signature HMAC |

---

## Documentation



- [Workflow projet](./docs/PROJECT-WORKFLOW.md) — parcours, actions suivantes, automatisations
- [Architecture](./docs/ARCHITECTURE.md) — DDD, bounded contexts

- [Setup Supabase](./docs/SETUP-SUPABASE.md) — configuration principale
- [Setup base de données](./docs/SETUP-DATABASE.md) — alternatives PostgreSQL

- [Conventions](./docs/CONVENTIONS.md) — Nommage, structure modules



## Licence



Propriétaire — Usage commercial.

