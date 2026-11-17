import { loadConfig } from '../config';
import { createDb } from './database';
import { migrateToLatest } from './migrator';

/**
 * Jalankan migrasi sebagai langkah deploy terpisah, dengan akun DB migrator (PRD 4.10,
 * 4.15). Server API tidak pernah mengubah skema saat start.
 */
const config = loadConfig();
const db = createDb(config);
try {
  const applied = await migrateToLatest(db);
  console.log(
    applied.length > 0 ? `Migrasi diterapkan: ${applied.join(', ')}` : 'Skema sudah terbaru.',
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  if (error instanceof Error && error.cause instanceof Error) console.error(error.cause.message);
  process.exitCode = 1;
} finally {
  await db.destroy();
}
