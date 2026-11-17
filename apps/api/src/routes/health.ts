import type { FastifyPluginAsync } from 'fastify';
import { sql } from 'kysely';

/**
 * `/healthz`: proses hidup (untuk restart container). `/readyz`: DB bisa dijangkau
 * (untuk reverse proxy/monitoring). Keduanya tidak memuat detail konfigurasi.
 */
export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/healthz', async () => ({ status: 'ok' }));

  app.get('/readyz', async (request, reply) => {
    try {
      await sql`SELECT 1`.execute(app.deps.db);
      return { status: 'ok' };
    } catch (error) {
      request.log.error({ err: error }, 'readiness: database tidak terjangkau');
      return reply.code(503).send({ status: 'unavailable' });
    }
  });
};
