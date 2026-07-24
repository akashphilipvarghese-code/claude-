# Tradeix Interface

Two tracks: `/` is the marketing landing page, `/dashboard` is the product
(Live Map), gated behind real auth.

## Run locally (proven working as of this build)
```bash
npm install
npm run db:migrate   # creates dev.db with the real schema
npm run db:seed      # seeds a demo user + 5 shipments
npm run dev           # http://localhost:3000
```

Demo login: `demo@tradeix.com` / `demo1234`

- `/` — landing page, no auth needed
- `/dashboard` — redirects to `/login` if you're not signed in
- `/api/shipments` — returns 401 without a session; with one, returns only
  that user's shipments (verified directly with curl — see roadmap doc)

## What's real right now
- SQLite database (`dev.db`), created by `scripts/migrate.ts`, same shape as `schema.sql`
- bcrypt password hashing + JWT session cookies (`lib/session.ts`)
- `middleware.ts` actually blocks `/dashboard` without a valid session
- `/api/shipments` actually queries the database and scopes rows to the
  logged-in customer — not a client-side filter, an actual `WHERE customer_id = ?`
- Production build verified clean: `npx next build` — 11 routes compiled,
  zero errors

## Build & run in Docker
```bash
docker build -t tradeix-interface .
docker run -p 3000:3000 --env-file .env tradeix-interface
curl http://localhost:3000/api/health
```

## CI/CD
`.github/workflows/ci-cd.yml`: lint → test → build → container vulnerability
scan → deploy (placeholder — no target infra provisioned yet).

## What's not wired yet
- Real shipment data — seed data only, no AIS/carrier/port API integration
- Postgres for production (currently SQLite; swap the `db.ts`/`scripts/*`
  layer when Phase 5 infra exists — schema.sql is already Postgres-shaped)
- Deploy target, secrets, real rollback
- Legal pages (privacy policy, terms)
