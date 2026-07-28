# Architecture WorkPilot

## 1. Principes directeurs

### Pourquoi cette architecture ?

| Principe | Choix | Justification |
|----------|-------|---------------|
| **Scalabilité** | Monorepo + modules NestJS découplés | 100k+ users : déploiement indépendant possible, code partagé typé |
| **Maintenabilité** | Clean Architecture + DDD | Chaque bounded context évolue sans casser les autres |
| **Performance UX** | React Query + WebSocket + Redis | Données fraîches, notifications temps réel, cache intelligent |
| **Extensibilité IA** | Event-driven + ports/adapters | Les features IA consomment des events domain sans couplage |
| **GraphQL futur** | REST d'abord, couche application isolée | Les use cases restent identiques ; seule la couche présentation change |

---

## 2. Bounded Contexts (DDD)

```
┌─────────────────────────────────────────────────────────────────┐
│                        WORK PILOT PLATFORM                       │
├──────────┬──────────┬──────────┬──────────┬──────────┬─────────┤
│   IAM    │ Workspace│  Project │   Task   │ Collab   │ Intel   │
│          │          │          │          │          │         │
│ Auth     │ Teams    │ Projects │ Tasks    │ Comments │ Remind  │
│ Sessions │ Members  │ Lists    │ Subtasks │ Attach   │ Daily   │
│ RBAC     │ Settings │ Sprints  │ Tags     │ Activity │ Focus   │
│          │          │ Roadmap  │ Deps     │ Notif WS │ Search  │
└──────────┴──────────┴──────────┴──────────┴──────────┴─────────┘
                              │
                    ┌─────────▼─────────┐
                    │   AI (Phase 5)    │
                    │  Event consumer   │
                    └───────────────────┘
```

Chaque context = **1 module NestJS** avec ses propres :
- `domain/` — entités, value objects, règles métier
- `application/` — use cases, ports (interfaces)
- `infrastructure/` — Prisma repos, Redis, S3, email
- `presentation/` — controllers REST, gateways WS

---

## 3. Clean Architecture (par module)

```
presentation/
  └── controllers/, gateways/, dto/
application/
  └── use-cases/, ports/, mappers/
domain/
  └── entities/, value-objects/, events/, errors/
infrastructure/
  └── prisma/, redis/, s3/, email/, queue/
```

**Règle d'or** : les dépendances vont toujours vers l'intérieur (domain ne connaît rien d'externe).

---

## 4. Modèle de données (PostgreSQL)

### Hiérarchie workspace

```
User ──< WorkspaceMember >── Workspace
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                 Team        Project        Document
                    │             │
                    │        ProjectList
                    │             │
                    └──────> Task ──< Subtask
                               │
                    Comment, Attachment, Tag, Activity
```

### Entités clés

| Entité | Responsabilité |
|--------|----------------|
| `Workspace` | Tenant principal (multi-tenant) |
| `Project` | Conteneur avec budget, santé, progression |
| `ProjectList` | Colonnes / listes (Kanban, backlog…) |
| `Task` | Unité de travail avec checklist, deps, temps |
| `Sprint` | Timebox lié à un projet |
| `Activity` | Audit trail immutable (event sourcing light) |
| `Notification` | In-app + push + email |
| `Reminder` | Smart reminders avec logique de charge |

### Multi-tenancy

- **Row-level** : chaque table métier a `workspaceId`
- **Isolation** : middleware NestJS injecte `workspaceId` depuis JWT
- **Index** : composite `(workspaceId, ...)` sur toutes les requêtes fréquentes

---

## 5. Authentification & sécurité

```
Login → Access Token (15min) + Refresh Token (7j, rotation)
                │
                ▼
        Redis (blacklist + sessions)
                │
                ▼
        JWT payload: { sub, workspaceId, role, permissions }
```

- Refresh token rotation à chaque usage
- RBAC : `OWNER | ADMIN | MEMBER | GUEST`
- Permissions granulaires par ressource (projet, tâche)

---

## 6. Temps réel (WebSocket)

```
Client ──WS──► Gateway (NestJS) ──► Redis Pub/Sub ──► Autres instances API
                      │
                      ▼
              NotificationService
              ActivityService
```

**Events WS** : `comment.created`, `notification.new`, `activity.new`, `ai.job.completed`

---

## 6bis. Workflow projet (résumé)

Voir le guide détaillé : **[PROJECT-WORKFLOW.md](./PROJECT-WORKFLOW.md)**

```
Créer projet → project.created → IA breakdown
     ↓
Planifier tâches (+ échéances → calendrier)
     ↓
Kanban / Focus → progression % auto
     ↓
Collaboration (WS) + Intelligence (Brief, Reminders)
     ↓
Réunions → résumé IA → tâches suivi
     ↓
Clôture (100 %) → archivage
```

---

## 7. Smart Reminders (conception)

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│ Cron / Queue │────►│ WorkloadEngine  │────►│ ReminderSvc  │
└──────────────┘     │ (heures/jour)   │     │ push/email/  │
                     └─────────────────┘     │ in-app       │
                              │              └──────────────┘
                              ▼
                     Propositions UX:
                     • "Commencer maintenant"
                     • "Décaler automatiquement"
```

**WorkloadEngine** calcule la charge du jour à partir des tâches assignées + temps estimé restant.

---

## 8. Daily Brief

Généré chaque matin (cron 6h timezone user) :

```typescript
interface DailyBrief {
  greeting: string;
  criticalTasks: TaskSummary[];
  meetings: MeetingSummary[];
  overdue: TaskSummary[];
  estimatedHours: number;
  mainGoal: TaskSummary | null;
}
```

Cache Redis TTL 1h, invalidé sur changement tâche critique.

---

## 9. Focus Mode

- État côté client (Zustand) + sync serveur (`UserFocusSession`)
- WebSocket : pause notifications non-critiques
- Chrono serveur pour `actualTime` fiable

---

## 10. Recherche globale

**Phase 4** : PostgreSQL `tsvector` + index GIN  
**Scale** : migration Elasticsearch/OpenSearch via port `SearchRepository`

```
GET /search?q=...&types=task,project,document,person
```

Debounce 150ms côté client, résultats groupés par type (style Raycast).

---

## 11. Module IA

```
Domain Events ──► Event Bus ──► AiOrchestrator ──► IAIService (mock → LLM)
                                      │
                                      ▼
                               AIJob + WebSocket ai.job.completed
```

| Feature IA | Trigger | Output | Statut |
|------------|---------|--------|--------|
| Découpage projet | `project.created` (auto) + POST manual | Tâches suggérées | ✅ |
| Résumé réunion | POST `/ai/meetings/:id/summarize` | Summary + keyPoints | ✅ |
| Analyse risque | POST `/ai/tasks/:id/risk` | RiskScore | ✅ |
| Assistant chat | POST `/ai/assistant` | Reply + suggestions | ✅ (mock) |
| Création tâches post-réunion | `meeting.summary.ready` | Tasks[] | ⏳ |
| Prédiction retards | `task.updated` | RiskScore auto | ⏳ |

**Port** : `IAIService` dans `modules/ai/application/ports/` — swap mock → OpenAI via config.

**Workflow complet** : [PROJECT-WORKFLOW.md](./PROJECT-WORKFLOW.md)

---

## 12. Frontend Architecture

```
apps/web/src/
├── app/              # Routes, providers, layout
├── features/         # 1 dossier par feature (colocation)
│   ├── auth/
│   ├── workspace/
│   ├── projects/
│   ├── tasks/
│   └── dashboard/
├── components/       # UI réutilisable (Shadcn + custom)
├── hooks/
├── lib/              # api client, utils
├── stores/           # Zustand (UI state, focus mode)
└── styles/           # tokens design system
```

### Design System

| Token | Light | Dark |
|-------|-------|------|
| Background | `#FAFAFA` | `#0A0A0B` |
| Surface | `#FFFFFF` | `#141415` |
| Border | `#E5E5E5` | `#27272A` |
| Accent | `#6366F1` | `#818CF8` |
| Radius | `8px` / `12px` | — |

Animations Framer Motion : `duration: 0.2`, `ease: [0.25, 0.1, 0.25, 1]`

---

## 13. API REST (conventions)

```
GET    /api/v1/workspaces/:wid/projects
POST   /api/v1/workspaces/:wid/projects
GET    /api/v1/workspaces/:wid/projects/:pid/tasks
PATCH  /api/v1/workspaces/:wid/tasks/:tid
```

- Versioning `/api/v1`
- Pagination : `?cursor=&limit=20`
- Réponses : `{ data, meta }` ou `{ error: { code, message } }`
- OpenAPI/Swagger auto-généré

---

## 14. Déploiement cible

```
                    ┌─────────────┐
                    │   CDN/Vercel │ ← apps/web
                    └─────────────┘
                    ┌─────────────┐
                    │  API (x N)   │ ← apps/api (horizontal scale)
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
      PostgreSQL        Redis            S3
      (RDS)          (ElastiCache)    (uploads)
```

---

## 15. Prochaines étapes (Phase 0)

1. ✅ Monorepo + Docker
2. 🔄 Schéma Prisma complet (entités core)
3. 🔄 Module Auth (register, login, refresh)
4. 🔄 Module Workspace + Teams
5. 🔄 Shell UI (layout, sidebar, theme toggle)
6. ✅ Module Projects + Tasks CRUD
