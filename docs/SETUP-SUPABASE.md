# Supabase — WorkPilot

WorkPilot utilise **Supabase** pour :

- **PostgreSQL** — base de données
- **Auth** — inscription / connexion (email + mot de passe)
- **Storage** — pièces jointes

L'API émet ensuite ses propres **tokens JWT** (workspace, rôle) pour le reste de l'application.

---

## 1. Créer le projet Supabase

1. [supabase.com](https://supabase.com) → **New project**
2. Note le mot de passe de la base de données
3. Attends que le projet soit prêt (~2 min)

---

## 2. Auth (connexion / inscription)

**Authentication → Providers → Email** : activé

Pour le **développement local**, désactive la confirmation email :

**Authentication → Providers → Email → Confirm email** → **OFF**

Sinon l'inscription renverra « Confirmez votre email » sans session.

**Settings → API** :

| Clé | Où l'utiliser |
|-----|----------------|
| `Project URL` | `SUPABASE_URL` (API) + `VITE_SUPABASE_URL` (web) |
| `anon` `public` | `VITE_SUPABASE_ANON_KEY` (web uniquement) |
| `service_role` `secret` | `SUPABASE_SERVICE_ROLE_KEY` (API uniquement — jamais côté client) |

### Frontend (`apps/web/.env`)

```env
VITE_SUPABASE_URL="https://xxxx.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJ..."
```

### Backend (`apps/api/.env`)

```env
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

---

## 3. Base de données PostgreSQL

**Settings → Database → Connection string**

| Variable | Où la trouver | Usage |
|----------|---------------|--------|
| `DATABASE_URL` | **Connection pooling** → URI (port **6543**) | API runtime |
| `DIRECT_URL` | **Direct connection** → URI (port **5432**) | Migrations Prisma |

```env
DATABASE_URL="postgresql://postgres.xxxx:[PASSWORD]@....pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxx:[PASSWORD]@....pooler.supabase.com:5432/postgres"
```

---

## 4. Storage (pièces jointes)

1. **Storage → New bucket** → nom : `attachments`
2. Coche **Public bucket** (dev) ou configure RLS (prod)

```env
SUPABASE_STORAGE_BUCKET="attachments"
```

---

## 5. Installation complète

```bash
pnpm install

# API
cp apps/api/.env.example apps/api/.env
# remplir DATABASE_URL, DIRECT_URL, SUPABASE_*

# Web
cp apps/web/.env.example apps/web/.env
# remplir VITE_SUPABASE_*

pnpm db:migrate
pnpm db:seed      # crée aussi les comptes démo dans Supabase Auth
pnpm dev
```

Comptes démo : `admin@workpilot.test` / `Test1234!`

---

## Flux d'authentification

```
Inscription :
  1. Web → supabase.auth.signUp(email, password)
  2. Web → POST /auth/supabase/register (Bearer token Supabase)
  3. API → crée User + Workspace → tokens JWT applicatifs

Connexion :
  1. Web → supabase.auth.signInWithPassword
  2. Web → POST /auth/supabase/session (Bearer token Supabase)
  3. API → tokens JWT applicatifs (workspace, rôle)
```

Sans `VITE_SUPABASE_*`, le frontend retombe sur l'auth legacy (`/auth/login`, `/auth/register`).

---

## Dépannage

| Problème | Solution |
|----------|----------|
| Migrate échoue | `DIRECT_URL` sur port **5432** |
| Inscription bloquée | Désactiver « Confirm email » dans Supabase |
| Comptes démo invalides | Relancer `pnpm db:seed` avec `SUPABASE_SERVICE_ROLE_KEY` |
| Upload échoue | Bucket `attachments` + clé service |

---

## Fallback local

Sans Supabase Storage → fichiers dans `apps/api/uploads/`.  
Sans `VITE_SUPABASE_*` → auth legacy bcrypt + JWT.
