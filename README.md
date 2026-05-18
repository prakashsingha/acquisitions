# Acquisitions API

Node.js REST API for acquisitions, with authentication, Drizzle ORM, and Neon Postgres. This project supports **Docker-based development with [Neon Local](https://neon.com/docs/local/neon-local)** and **production deployment against Neon Cloud**.

## Architecture overview

| Environment | Database target | How it connects |
|-------------|-----------------|-------------------|
| **Development** | Neon Local (Docker) | App → `neon-local:5432` → ephemeral Neon branch |
| **Production** | Neon Cloud | App → `DATABASE_URL` (`*.neon.tech`) directly |

The same application image reads `DATABASE_URL` from the environment. Development sets `NEON_LOCAL=true` so the Neon serverless driver uses the Local HTTP proxy; production uses the cloud URL with no proxy.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2
- A [Neon](https://neon.tech) account with a project
- Neon API key ([manage API keys](https://console.neon.tech/app/settings/api-keys))
- Neon **Project ID** (Console → Project Settings → General)

## Quick start — development (Neon Local)

### 1. Configure environment

```bash
cp .env.development.example .env.development
```

Edit `.env.development` and set:

- `NEON_API_KEY`
- `NEON_PROJECT_ID`
- `JWT_SECRET` (any dev value)
- Optionally `PARENT_BRANCH_ID` to control which branch ephemeral copies fork from

`DATABASE_URL` is overridden in `docker-compose.dev.yml` to point at the `neon-local` service:

```text
postgres://neon:npg@neon-local:5432/neondb?sslmode=require
```

### 2. Start Neon Local + app

```bash
docker compose -f docker-compose.dev.yml --env-file .env.development up --build
```

This starts:

1. **`neon-local`** — proxies to Neon and creates an **ephemeral branch** when the container starts (deleted when it stops, unless you configure `DELETE_BRANCH=false`).
2. **`app`** — Acquisitions API on [http://localhost:3000](http://localhost:3000).

### 3. Run migrations (first time / after schema changes)

```bash
docker compose -f docker-compose.dev.yml --env-file .env.development --profile migrate run --rm migrate
```

### 4. Verify

```bash
curl http://localhost:3000/health
curl http://localhost:3000/
```

### Stop

```bash
docker compose -f docker-compose.dev.yml --env-file .env.development down
```

Stopping removes the ephemeral Neon branch (default Neon Local behavior).

---

## Production (Neon Cloud)

Production connects **directly** to your Neon Cloud database. There is **no** `neon-local` container in production.

### 1. Configure environment

```bash
cp .env.production.example .env.production
```

Set your real Neon Cloud connection string:

```env
DATABASE_URL=postgres://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=<strong-random-secret>
ARCJET_KEY=<your-arcjet-key>
NODE_ENV=production
```

Get `DATABASE_URL` from **Neon Console → Connection Details**.

Do **not** set `NEON_LOCAL` or `NEON_LOCAL_HOST` in production.

### 2. Run migrations (CI/CD or one-off)

Run against production from a machine with network access to Neon:

```bash
export $(grep -v '^#' .env.production | xargs)
npx drizzle-kit migrate
```

Or use your CI pipeline before deploying the container.

### 3. Start production stack

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up --build -d
```

Only the **app** service runs; it uses `DATABASE_URL` from `.env.production`.

### 4. Verify

```bash
curl http://localhost:3000/health
```

---

## How `DATABASE_URL` switches between dev and prod

```text
┌─────────────────────────────────────────────────────────────────┐
│                     docker-compose.dev.yml                      │
│  neon-local ──► ephemeral branch (Neon Cloud)                   │
│       ▲                                                         │
│       │ postgres://neon:npg@neon-local:5432/neondb            │
│       │ NEON_LOCAL=true  →  serverless driver HTTP proxy        │
│     app                                                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    docker-compose.prod.yml                      │
│     app ──► DATABASE_URL=postgres://...@ep-xxx.neon.tech/...    │
│             (no NEON_LOCAL, direct Neon Cloud)                  │
└─────────────────────────────────────────────────────────────────┘
```

| Variable | Development | Production |
|----------|-------------|------------|
| `DATABASE_URL` | `postgres://neon:npg@neon-local:5432/neondb?...` (via compose) | `postgres://...@*.neon.tech/...` |
| `NEON_LOCAL` | `true` | unset / false |
| `NEON_LOCAL_HOST` | `neon-local` | unset |
| `NEON_API_KEY` | Required (Neon Local container) | Not used by app |
| `NEON_PROJECT_ID` | Required (Neon Local container) | Not used by app |

Application code (`src/config/database.js`) detects Neon Local via `NEON_LOCAL` or a `neon-local` host in `DATABASE_URL` and configures the serverless driver:

```javascript
neonConfig.fetchEndpoint = 'http://neon-local:5432/sql';
neonConfig.useSecureWebSocket = false;
neonConfig.poolQueryViaFetch = true;
```

---

## NPM scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run locally with Node (requires `DATABASE_URL` in `.env`) |
| `npm run docker:dev` | `docker compose -f docker-compose.dev.yml up --build` |
| `npm run docker:dev:down` | Stop development stack |
| `npm run docker:prod` | Start production stack (detached) |
| `npm run docker:migrate` | Run migrations against dev Neon Local |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run migrations (host, with env loaded) |

---

## File reference

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-target image (`development` / `production`) |
| `docker-compose.dev.yml` | App + Neon Local for local development |
| `docker-compose.prod.yml` | App only, Neon Cloud via env |
| `.env.development.example` | Template for local Docker dev |
| `.env.production.example` | Template for production secrets |
| `src/config/database.js` | Neon Local vs Cloud driver configuration |

---

## Running without Docker (optional)

1. Start Neon Local manually (see [Neon Local docs](https://neon.com/docs/local/neon-local)).
2. Copy `.env.development.example` to `.env` and set `DATABASE_URL=postgres://neon:npg@localhost:5432/neondb?sslmode=require` plus `NEON_LOCAL=true`.
3. `npm install && npm run dev`

---

## Security notes

- Never commit `.env.development`, `.env.production`, or `.env` with real secrets.
- Use strong `JWT_SECRET` in production.
- Rotate Neon credentials if exposed.
- Add `.neon_local/` to ignore list if using persistent branch metadata volumes.

---

## Troubleshooting

**App cannot connect to database in dev**

- Ensure `neon-local` is running: `docker compose -f docker-compose.dev.yml ps`
- Confirm `NEON_API_KEY` and `NEON_PROJECT_ID` are set in `.env.development`
- Run migrations after Neon Local is up

**Ephemeral branch empty after restart**

- Expected: each `docker compose up` creates a fresh branch. Re-run migrations.

**Production health check fails**

- Verify `DATABASE_URL` reaches Neon from the container network
- Check logs: `docker logs acquisitions-app-prod`

---

## Links

- [Neon Local documentation](https://neon.com/docs/local/neon-local)
- [Neon serverless driver](https://neon.com/docs/serverless/serverless-driver)
- [Drizzle ORM](https://orm.drizzle.team/)
