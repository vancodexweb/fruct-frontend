# Fruct CRM — Frontend

Next.js 16 (App Router, TypeScript strict) frontend for **Fruct CRM** — a CRM for a computer-chair
retailer selling via Avito: leads, deals, warehouse/catalog, delivery-cost calculation, manager
payroll and analytics. This app is a pure client of the already-existing NestJS backend
(`vancodexweb/fruct`) — it holds no business logic and no database of its own.

Stack: Next.js 16 App Router, React 19, TypeScript strict, `@tanstack/react-query` for all
server-state (no `useEffect` anywhere in this codebase), custom CSS Modules design system (no
Tailwind/UI framework), Montserrat via `next/font/google`.

---

## 1. Architecture in one paragraph

The browser never talks to the NestJS backend directly and never holds its JWTs. Login goes
through this app's own `POST /api/auth/login` Route Handler, which calls the backend and stores
the resulting access/refresh tokens in **httpOnly cookies**. Every page's initial render is a
Server Component that reads those cookies and calls the backend directly
(`lib/api/server-fetcher.ts`). Every client-side read/write (React Query) goes through
`POST/GET/PATCH/PUT/DELETE /api/proxy/[...path]`, a Route Handler that reads the httpOnly cookie,
attaches `Authorization: Bearer <token>`, refreshes it transparently if expired, and forwards the
request to the backend. `proxy.ts` (Next 16's renamed `middleware.ts`) protects every page route
and additionally 307-redirects a MANAGER away from OWNER-only sections (`/analytics`, `/payouts`,
`/managers`) to `/403`.

## 2. Local development (no Docker)

Requires the backend already running somewhere reachable (see `vancodexweb/fruct`'s own README
for running it locally with `npm run start:dev` against a local Postgres/Redis, or against a
already-deployed instance).

```bash
npm install
cp .env.example .env.local   # then edit API_URL to point at your backend
npm run dev
```

Open http://localhost:3000. Log in with the OWNER account created by the backend's
`prisma/seed.ts` (there is no public registration screen — this app has none either, by design).

Useful scripts:

```bash
npm run dev         # dev server (Turbopack)
npm run build        # production build (standalone output)
npm run start        # run the production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run format       # Prettier --write
```

## 3. One-command production deployment

The backend is already deployed via `docker-compose.prod.yml` + Caddy (see `vancodexweb/fruct`'s
README). This frontend is designed to join that exact stack as one more service, sharing its
Docker network, so a single `docker compose` invocation brings up the whole product (Postgres,
Redis, the API, this frontend, and Caddy in front of all of it).

**Expected layout on the server — the two repos as sibling directories:**

```
/opt/fruct/                 (or wherever)
├── fruct/                  ← backend repo (vancodexweb/fruct)
│   ├── docker-compose.prod.yml
│   ├── Caddyfile
│   └── .env
└── fruct-frontend/         ← this repo
    ├── docker-compose.yml
    ├── Dockerfile
    ├── deploy/Caddyfile
    └── .env
```

```bash
# One-time: clone both repos as siblings, then create each .env from its example
git clone <backend-repo-url> fruct
git clone <this-repo-url> fruct-frontend
cd fruct && cp .env.example .env   # fill in per the backend's own README
cd ../fruct-frontend && cp .env.example .env   # see table below

# Deploy everything with ONE command, run from the backend directory:
cd ../fruct
docker compose -f docker-compose.prod.yml -f ../fruct-frontend/docker-compose.yml up -d --build
```

This merges the two compose files into a single project: it adds the `frontend` service and
overrides `caddy`'s Caddyfile mount with `fruct-frontend/deploy/Caddyfile`, which proxies the
public domain to `frontend:3000` instead of directly to `api:3001` — `caddy` ends up depending on
both `api` and `frontend` being healthy before it starts routing traffic.

Verify:

```bash
docker compose -f docker-compose.prod.yml -f ../fruct-frontend/docker-compose.yml ps
docker compose -f docker-compose.prod.yml -f ../fruct-frontend/docker-compose.yml logs -f frontend
curl -i https://<your-domain>/            # through Caddy
```

To update after a `git pull` in either repo, re-run the same `up -d --build` command from
`fruct/` — Compose rebuilds only the images whose context changed.

### Frontend environment variables (`fruct-frontend/.env`)

| Variable | Required | Meaning |
|---|---|---|
| `NODE_ENV` | yes | `production` in the deployed stack. |
| `PORT` | yes | Port the Next.js server listens on inside its container (`3000`). |
| `HOSTNAME` | yes | Interface to bind (`0.0.0.0` — required in Docker so the healthcheck and Caddy, a different container, can reach it). |
| `API_URL` | yes | Base URL of the backend, **reachable from this server, never from the browser**. In the Docker stack: `http://api:3001` (the backend's own service name on the shared Compose network). For local dev without Docker: `http://localhost:3001`. |

That's the entire frontend configuration surface — everything else (JWT secrets, SMTP, DeepSeek,
the domain, Postgres/Redis credentials) belongs to the backend's own `.env` and is never touched
by this app.

## 4. Section-by-section overview

| Route | Who | What |
|---|---|---|
| `/login` | public | Email/password login (no self-registration). |
| `/` | all | Dashboard — role-aware summary + recent leads/deals/notifications. |
| `/leads`, `/leads/[id]` | all (MANAGER scoped to their own) | Full CRUD, status changes, OWNER-only manager assignment. |
| `/deals`, `/deals/new`, `/deals/[id]` | all (MANAGER scoped to their own) | Create from a lead, item/warehouse/delivery/discount handling, status transitions. |
| `/catalog` | read: all · write: OWNER | Categories, products (search), warehouses, stock, delivery options. |
| `/delivery-calc` | all | DeepSeek-backed + manual delivery cost estimation. |
| `/payouts`, `/payouts/[id]` | OWNER only | Preview, generate, approve, pay, send statements. |
| `/analytics` | OWNER only | Funnel, SLA, revenue, top products, manager comparison, purchase distribution — hand-rolled SVG charts. |
| `/notifications` | all | List + mark read. |
| `/scripts` | all | Sales-script templates with placeholder rendering. |
| `/managers` | OWNER only | Manager accounts: create, block/unblock, commission/discount-limit. |
| `/403` | all | Shown when a MANAGER hits an OWNER-only route. |

## 5. Project structure

```
app/
  (app)/            Authenticated shell (Sidebar/Topbar) + every feature route above
  api/auth/         Login/logout Route Handlers (set/clear httpOnly cookies)
  api/proxy/        The one Route Handler all client-side React Query calls go through
  login/, 403/      Public pages outside the authenticated shell
components/ui/      The whole design system (Button, Input, Table, Modal, Badge, ...)
components/layout/  Sidebar, Topbar
lib/api/            One file per backend domain: plain fetch functions + React Query hooks
lib/auth/           Cookie/session/JWT-decode helpers (server-only)
lib/format/         Currency/date formatting + Russian labels per enum
lib/session/        Client-side session context (role, email) fed from the server layout
types/              One file per backend domain, matching its DTOs exactly
proxy.ts            Route protection + OWNER-only gating + transparent token refresh
```

## 6. Conventions worth knowing before touching this code

- **No `useEffect`, anywhere.** Server state goes through React Query; derived values are computed
  at render time; one-off side effects run inside event handlers or React Query's own
  `onSuccess`/`onSettled`.
- **No CSS framework.** Every visual element is CSS Modules against the design tokens in
  `app/globals.css`, reused via `components/ui/*`.
- Every list/detail view explicitly renders three states — pending, error, empty — never assumes
  data is present.
- Decimal money fields from the backend are numeric **strings**; always format them with
  `lib/format/number.ts`'s `formatCurrency`, never do float arithmetic on them beyond simple
  client-side hints (e.g. a discount-limit preview).
