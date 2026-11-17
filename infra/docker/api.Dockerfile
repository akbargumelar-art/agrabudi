# syntax=docker/dockerfile:1
# Image API (Fastify). Dibangun dari root repo:
#   docker build -f infra/docker/api.Dockerfile -t agrabudi-api:<commit> .
# Satu image untuk dua peran: server (`node dist/main.js`) dan migrasi (`node dist/migrate.js`).
# Pin NODE_IMAGE ke digest saat rilis (PRD 4.2: jangan memakai tag bergerak sebagai strategi produksi).
ARG NODE_IMAGE=node:22-bookworm-slim

FROM ${NODE_IMAGE} AS build
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages/config/package.json packages/config/
COPY packages/contracts/package.json packages/contracts/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @agrabudi/api...
COPY packages/config packages/config
COPY packages/contracts packages/contracts
COPY apps/api apps/api
RUN pnpm --filter @agrabudi/api build \
  && pnpm --filter @agrabudi/api deploy --prod --legacy /out \
  && cp -r apps/api/dist /out/dist

FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out ./
RUN mkdir -p /var/lib/agrabudi/storage && chown node:node /var/lib/agrabudi/storage
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]
