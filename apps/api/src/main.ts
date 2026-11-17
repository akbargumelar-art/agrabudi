import { buildApp } from './app';
import { loadConfig } from './config';
import { createDb } from './db/database';
import { createLocalStorage } from './lib/storage';

const config = loadConfig();
const db = createDb(config);
const storage = createLocalStorage(config.STORAGE_DIR, config.MEDIA_PUBLIC_BASE_URL);

const app = await buildApp(
  { config, db, storage },
  {
    level: config.LOG_LEVEL,
    // Cookie, header otorisasi, dan Set-Cookie tidak pernah masuk log (PRD 4.13).
    redact: {
      paths: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]'],
      remove: true,
    },
  },
);

let closing = false;
async function shutdown(signal: string) {
  if (closing) return;
  closing = true;
  app.log.info({ signal }, 'menutup server');
  try {
    await app.close();
    await db.destroy();
  } finally {
    process.exit(0);
  }
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

await app.listen({ host: config.HOST, port: config.PORT });
