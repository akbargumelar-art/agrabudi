import { randomUUID } from 'node:crypto';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyServerOptions } from 'fastify';
import { registerOriginCheck } from './auth/origin';
import { trustProxyValue, type AppConfig } from './config';
import type { Db } from './db/database';
import { registerErrorHandling } from './lib/errors';
import type { FileStorage } from './lib/storage';
import { createWahaSender, type WaSender } from './lib/waha';
import { createNotifier, type Notifier } from './domain/notifications';
import { accountRoutes } from './routes/accounts';
import { cmsRoutes } from './routes/cms';
import { formRoutes } from './routes/forms';
import { healthRoutes } from './routes/health';
import { outletRoutes } from './routes/outlet';
import { portalRoutes } from './routes/portal';
import { publicRoutes } from './routes/public';
import { staffAuthRoutes } from './routes/staff-auth';

/**
 * `wa` bawaan dibuat dari WAHA_* di konfigurasi (`null` bila tidak diisi = notifikasi mati).
 * Tes mengisi pengirim tiruan supaya tidak pernah menghubungi WAHA sungguhan.
 */
export type AppDeps = { config: AppConfig; db: Db; storage: FileStorage; wa?: WaSender | null };

declare module 'fastify' {
  interface FastifyInstance {
    deps: AppDeps & { wa: WaSender | null };
    notifier: Notifier;
  }
}

/** Batas ukuran multipart: CV 2 MB, gambar website 5 MB. Diperiksa lagi per route. */
export const MULTIPART_MAX_FILE_BYTES = 5 * 1024 * 1024;

export async function buildApp(deps: AppDeps, logger: FastifyServerOptions['logger'] = false) {
  const { config } = deps;
  const app = Fastify({
    logger,
    trustProxy: trustProxyValue(config.TRUST_PROXY),
    bodyLimit: 64 * 1024,
    // ID permintaan dari reverse proxy dipakai bila bentuknya wajar, supaya log bisa ditelusuri.
    genReqId(request) {
      const incoming = request.headers['x-request-id'];
      return typeof incoming === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(incoming)
        ? incoming
        : randomUUID();
    },
  });
  const wa = deps.wa === undefined ? createWahaSender(config) : deps.wa;
  app.decorate('deps', { ...deps, wa });
  app.decorate('notifier', createNotifier(deps.db, wa, app.log));

  registerErrorHandling(app);
  registerOriginCheck(app, config);

  app.addHook('onSend', async (request, reply, payload) => {
    reply.header('x-request-id', request.id);
    reply.header('x-content-type-options', 'nosniff');
    // Respons API berisi data sesi atau data milik akun: jangan masuk cache bersama.
    if (!reply.hasHeader('cache-control')) reply.header('cache-control', 'no-store');
    return payload;
  });

  await app.register(cookie);
  await app.register(rateLimit, {
    global: false,
    enableDraftSpec: true,
    allowList: () => !config.RATE_LIMIT_ENABLED,
  });
  await app.register(multipart, {
    throwFileSizeLimit: true,
    limits: { fileSize: MULTIPART_MAX_FILE_BYTES, files: 1, fields: 20, fieldSize: 4 * 1024 },
  });

  await app.register(healthRoutes);
  await app.register(publicRoutes, { prefix: '/api/public/v1' });
  await app.register(formRoutes, { prefix: '/api/public/v1/forms' });
  await app.register(outletRoutes, { prefix: '/api/v1/outlet' });
  await app.register(staffAuthRoutes, { prefix: '/api/v1' });
  await app.register(portalRoutes, { prefix: '/api/v1' });
  await app.register(accountRoutes, { prefix: '/api/v1' });
  await app.register(cmsRoutes, { prefix: '/web-admin/api/v1' });

  return app;
}
