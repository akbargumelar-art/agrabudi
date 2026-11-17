# syntax=docker/dockerfile:1
# Reverse proxy Nginx + bundel statis Outlet dan Portal (PRD 4.2: build statis dilayani Nginx,
# bukan `vite preview`). Variabel VITE_* masuk ke bundel saat build.
ARG NODE_IMAGE=node:22-bookworm-slim
ARG NGINX_IMAGE=nginx:1.28-alpine

FROM ${NODE_IMAGE} AS build
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages/config/package.json packages/config/
COPY packages/contracts/package.json packages/contracts/
COPY packages/ui/package.json packages/ui/
COPY apps/outlet-web/package.json apps/outlet-web/
COPY apps/portal-web/package.json apps/portal-web/
RUN pnpm install --frozen-lockfile --filter @agrabudi/outlet-web... --filter @agrabudi/portal-web...
COPY packages packages
COPY apps/outlet-web apps/outlet-web
COPY apps/portal-web apps/portal-web
ARG VITE_APP_URL_PUBLIC
ARG VITE_APP_URL_OUTLET
ARG VITE_APP_URL_PORTAL
ARG VITE_DATA_SOURCE=api
RUN pnpm --filter @agrabudi/outlet-web build && pnpm --filter @agrabudi/portal-web build

FROM ${NGINX_IMAGE} AS runtime
COPY infra/nginx/templates /etc/nginx/templates
COPY infra/nginx/snippets /etc/nginx/snippets
COPY --from=build /repo/apps/outlet-web/dist /usr/share/nginx/html/outlet
COPY --from=build /repo/apps/portal-web/dist /usr/share/nginx/html/portal
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/nginx-health || exit 1
