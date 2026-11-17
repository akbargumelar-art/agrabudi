# syntax=docker/dockerfile:1
# Image website Publik (Next.js standalone). Variabel NEXT_PUBLIC_* masuk ke bundel saat build,
# jadi image staging dan produksi dibangun terpisah dengan URL masing-masing.
#   docker build -f infra/docker/public-web.Dockerfile \
#     --build-arg NEXT_PUBLIC_APP_URL_PUBLIC=https://agrabudi.id ... -t agrabudi-public:<commit> .
ARG NODE_IMAGE=node:22-bookworm-slim

FROM ${NODE_IMAGE} AS build
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages/config/package.json packages/config/
COPY packages/contracts/package.json packages/contracts/
COPY packages/ui/package.json packages/ui/
COPY apps/public-web/package.json apps/public-web/
RUN pnpm install --frozen-lockfile --filter @agrabudi/public-web...
COPY packages packages
COPY apps/public-web apps/public-web
ARG NEXT_PUBLIC_APP_URL_PUBLIC
ARG NEXT_PUBLIC_APP_URL_OUTLET
ARG NEXT_PUBLIC_APP_URL_PORTAL
# Produksi selalu `api`. `mock` hanya untuk pratinjau desain yang diberi label.
ARG NEXT_PUBLIC_DATA_SOURCE=api
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_OUTPUT=standalone
RUN pnpm --filter @agrabudi/public-web build

FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /repo/apps/public-web/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/public-web/.next/static ./apps/public-web/.next/static
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/kontak').then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/public-web/server.js"]
