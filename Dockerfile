# syntax=docker/dockerfile:1

# ---- deps: install once, reused by the build stage ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build: compile the Next.js standalone server ----
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NODE_ENV=production so `next build` doesn't include dev-only React warnings
# in the output bundle; no runtime secrets are needed at build time — the
# app never reads process.env.API_URL until request time (see lib/api/server-fetcher.ts).
ENV NODE_ENV=production
RUN npm run build

# ---- runtime: minimal image, only the standalone server output ----
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
RUN useradd --create-home --shell /bin/bash appuser

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# `output: 'standalone'` (next.config.ts) traces the exact runtime
# dependencies into .next/standalone, including a pruned node_modules — no
# `npm ci --omit=dev` needed here, unlike a non-standalone deployment.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
