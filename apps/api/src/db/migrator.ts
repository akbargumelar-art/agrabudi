import type { Kysely } from 'kysely';
import { Migrator, type Migration, type MigrationProvider } from 'kysely/migration';
import type { Database } from './types';
import * as m0001 from './migrations/0001_init';
import * as m0002 from './migrations/0002_site_pages';

/**
 * Daftar migrasi diimpor statis supaya ikut bundel build. Migrasi baru ditambahkan di sini
 * dengan nama berurutan; migrasi yang sudah jalan di staging/produksi tidak boleh diubah.
 */
const migrations: Record<string, Migration> = {
  '0001_init': m0001,
  '0002_site_pages': m0002,
};

const provider: MigrationProvider = {
  getMigrations: async () => migrations,
};

/** Migrasi memakai SQL apa adanya, tanpa plugin camelCase. */
export function createMigrator(db: Kysely<Database>): Migrator {
  return new Migrator({
    db: db.withoutPlugins(),
    provider,
    migrationTableName: 'schema_migrations',
    migrationLockTableName: 'schema_migrations_lock',
  });
}

export async function migrateToLatest(db: Kysely<Database>): Promise<string[]> {
  const { error, results } = await createMigrator(db).migrateToLatest();
  const applied = (results ?? [])
    .filter((result) => result.status === 'Success')
    .map((result) => result.migrationName);
  const failed = (results ?? []).find((result) => result.status === 'Error');
  if (error) {
    throw new Error(`Migrasi gagal${failed ? ` pada ${failed.migrationName}` : ''}.`, {
      cause: error,
    });
  }
  return applied;
}
