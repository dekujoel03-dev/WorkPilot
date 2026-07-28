# Conventions WorkPilot

## Nommage

| Élément | Convention | Exemple |
|---------|------------|---------|
| Fichiers TS | kebab-case | `create-task.use-case.ts` |
| Classes | PascalCase | `CreateTaskUseCase` |
| Interfaces | PascalCase + prefix I (ports only) | `ITaskRepository` |
| Variables/fonctions | camelCase | `getTasksByProject` |
| Constantes | SCREAMING_SNAKE | `MAX_ATTACHMENTS` |
| Tables DB | snake_case pluriel | `workspace_members` |
| API routes | kebab-case pluriel | `/project-lists` |
| Events domain | dot.notation | `task.status.changed` |

## Structure module NestJS

```
modules/tasks/
├── domain/
│   ├── entities/task.entity.ts
│   ├── value-objects/priority.vo.ts
│   └── events/task-created.event.ts
├── application/
│   ├── ports/task.repository.port.ts
│   └── use-cases/create-task.use-case.ts
├── infrastructure/
│   └── prisma/prisma-task.repository.ts
├── presentation/
│   ├── dto/create-task.dto.ts
│   └── tasks.controller.ts
└── tasks.module.ts
```

## Git commits

Format : `type(scope): description`

Types : `feat`, `fix`, `refactor`, `docs`, `chore`, `test`

Exemples :
- `feat(tasks): add dependency graph validation`
- `fix(auth): rotate refresh token on reuse detection`

## Tests

- Unit : use cases + domain (Jest)
- Integration : repositories (Testcontainers PostgreSQL)
- E2E : API (Supertest)

Couverture cible Phase 1 : 70% sur `application/` et `domain/`.
