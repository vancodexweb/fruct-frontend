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

This frontend deploys as a **fully standalone stack** — its own `docker compose` project, its own
Caddy, its own domain. It does not read the backend's compose files, Caddyfile, or `.env`; the
only thing it needs from the backend is the name of its Docker network, so this stack's Caddy can
reverse-proxy to the backend's `api` container by service name.

**Port 80/443 conflict — read this first.** The backend already runs its own Caddy bound to ports
80/443. Two containers can't both bind the same host ports, so this stack's own Caddy needs those
ports freed first — it then takes over **both** domains (the frontend's and the backend's):

```bash
docker stop fruct-caddy-1   # or whatever the backend's Caddy container is actually named
```

This is a few seconds of downtime for the backend's public domain while the new stack starts, then
both domains are served again — by the new Caddy instead.

```bash
# 1. Clone this repo — anywhere, no sibling-directory requirement
git clone <this-repo-url> fruct-frontend
cd fruct-frontend
cp .env.example .env
```

Edit `.env` — only three values matter for deployment (see the table below for the rest):

```
FRONTEND_DOMAIN=vancodex.tech        # your domain — DNS A/AAAA already pointed at this server
BACKEND_DOMAIN=crm.vancodex.tech     # the backend's existing public domain
ACME_EMAIL=admin@vancodex.tech       # for Let's Encrypt expiry notices
```

```bash
# 2. Confirm the backend's Docker network name (almost always `<project>_default`;
#    e.g. containers named fruct-api-1 mean the network is fruct_default)
docker network ls

# 3. If it isn't fruct_default, edit docker-compose.yml's `networks.backend_net.name`
#    to match, then bring up the whole stack with ONE command:
docker compose up -d --build
```

Caddy issues certificates for both `FRONTEND_DOMAIN` and `BACKEND_DOMAIN` automatically on first
request. `deploy/Caddyfile` has two site blocks: `{$FRONTEND_DOMAIN} -> frontend:3000` and
`{$BACKEND_DOMAIN} -> api:3001` — the latter reaches the backend's `api` container because this
stack's `caddy` and `frontend` services join the backend's network as an `external: true` network
in `docker-compose.yml`. The frontend's own server-side code also talks to the backend over that
same internal network (`API_URL=http://api:3001`, hardcoded), never over the public internet.

This exact design — external network join, dual-domain Caddy routing, and the real Next.js
Docker build — was verified end-to-end with a live throwaway stack (a stub container standing in
for the backend's `api`, real domains substituted with test ones using Caddy's internal CA):
both domains got their own certificate, `front.test` correctly served the real built frontend,
`crm.test` correctly reverse-proxied to the stub backend, and the frontend container could reach
`api:3001` directly.

Verify on your server:

```bash
docker compose ps
docker compose logs -f caddy
curl -i https://vancodex.tech/           # your frontend
curl -i https://crm.vancodex.tech/       # your backend, now served by the same Caddy
```

To update after a `git pull`, re-run `docker compose up -d --build` from this repo's directory.

### Frontend environment variables (`.env`)

| Variable | Required | Meaning |
|---|---|---|
| `NODE_ENV` | yes | `production` in the deployed stack. |
| `PORT` | yes | Port the Next.js server listens on inside its container (`3000`). |
| `HOSTNAME` | yes | Interface to bind (`0.0.0.0` — required in Docker so the healthcheck and Caddy, a different container, can reach it). |
| `API_URL` | only outside Docker | Base URL of the backend, **reachable from this server, never from the browser**. In the Docker stack this is hardcoded to `http://api:3001` by `docker-compose.yml` — this `.env` value is only read by `npm run dev`/`npm run start` outside Docker, where it should be `http://localhost:3001`. |
| `FRONTEND_DOMAIN` | yes (Docker only) | The public domain this frontend should be reachable at, e.g. `vancodex.tech`. Point its DNS A/AAAA record at this server before deploying. |
| `BACKEND_DOMAIN` | yes (Docker only) | The backend's existing public domain, e.g. `crm.vancodex.tech` — used only for this stack's Caddy config, so it can keep serving the API after taking over ports 80/443 from the backend's own Caddy. |
| `ACME_EMAIL` | yes (Docker only) | Email Let's Encrypt/ZeroSSL uses for certificate-expiry notices. |

Everything else (JWT secrets, SMTP, DeepSeek, Postgres/Redis credentials) belongs to the backend's
own `.env` and is never touched by this app.

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
