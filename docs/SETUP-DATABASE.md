# Configuration base de données — WorkPilot

WorkPilot utilise **PostgreSQL via Supabase** par défaut.

Guide complet : **[SETUP-SUPABASE.md](./SETUP-SUPABASE.md)**

---

## Démarrage rapide

1. Crée un projet sur [supabase.com](https://supabase.com)
2. Copie `apps/api/.env.example` → `apps/api/.env`
3. Remplis `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
4. Crée un bucket Storage `attachments` (public)
5. Lance :

```bash
pnpm db:migrate
pnpm db:seed    # optionnel — comptes démo
pnpm dev
```

---

## Variables essentielles

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Pooler Supabase (port 6543) — API |
| `DIRECT_URL` | Connexion directe (port 5432) — migrations |
| `SUPABASE_URL` | URL du projet |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service (Storage) |

---

## Commandes

| Commande | Description |
|----------|-------------|
| `pnpm db:migrate` | Crée/applique les migrations |
| `pnpm db:setup` | Alias production (`migrate deploy`) |
| `pnpm db:push` | Sync schema sans migration (dev) |
| `pnpm db:studio` | Prisma Studio |
| `pnpm db:seed` | Données de démonstration |

---

## Alternatives

- **PostgreSQL local** : même schema Prisma, change les URLs de connexion
- **Neon** : compatible, remplace les URLs Supabase

SQLite n'est plus supporté (schema migré vers PostgreSQL).

---

## Redis (optionnel)

`REDIS_ENABLED=false` par défaut — cache en mémoire en dev.
