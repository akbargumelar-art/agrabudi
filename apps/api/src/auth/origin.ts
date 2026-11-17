import type { FastifyInstance } from 'fastify';
import type { AppConfig } from '../config';
import { HttpError } from '../lib/errors';

const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Origin aplikasi yang sah untuk tiap kelompok API, dari path permintaan. */
export function expectedOrigin(config: AppConfig, path: string): string | null {
  if (path.startsWith('/api/public/')) return new URL(config.APP_URL_PUBLIC).origin;
  if (path.startsWith('/api/v1/outlet/')) return new URL(config.APP_URL_OUTLET).origin;
  if (path.startsWith('/api/v1/')) return new URL(config.APP_URL_PORTAL).origin;
  if (path.startsWith('/web-admin/api/')) return new URL(config.APP_URL_PORTAL).origin;
  return null;
}

/**
 * Perlindungan CSRF untuk sesi cookie (PRD 4.13): aksi yang mengubah data wajib datang
 * dari origin aplikasinya sendiri. Subdomain saudara tidak dipercaya otomatis. Ini lapis
 * kedua di samping cookie SameSite=Strict.
 */
export function registerOriginCheck(app: FastifyInstance, config: AppConfig) {
  app.addHook('onRequest', async (request) => {
    if (!UNSAFE.has(request.method)) return;
    const path = request.url.split('?')[0] ?? '';
    const expected = expectedOrigin(config, path);
    if (expected === null) return;
    if (request.headers.origin !== expected) {
      throw new HttpError(
        403,
        'ORIGIN_REJECTED',
        'Permintaan ditolak karena tidak berasal dari aplikasi yang sah.',
      );
    }
  });
}
