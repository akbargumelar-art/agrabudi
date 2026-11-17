import { createDB } from 'mysql-memory-server';
import type { ProvidedContext } from 'vitest';
import type { TestProject } from 'vitest/node';
import { createDb } from '../src/db/database';
import { migrateToLatest } from '../src/db/migrator';

declare module 'vitest' {
  export interface ProvidedContext {
    mysql: { host: string; port: number; user: string; password: string; database: string };
  }
}

let server: Awaited<ReturnType<typeof createDB>> | undefined;

/**
 * Tes integrasi memakai MySQL 8.4 sungguhan, bukan tiruan, supaya transaksi, lock, unique
 * key, dan CHECK benar-benar diuji. Bila TEST_DB_HOST diisi (mis. service container CI),
 * database itu yang dipakai; selain itu biner MySQL resmi dijalankan sementara (diunduh
 * sekali lalu di-cache). Migrasi dijalankan dengan kode yang sama dengan langkah deploy.
 */
export default async function setup(project: TestProject) {
  let connection: ProvidedContext['mysql'];
  if (process.env.TEST_DB_HOST) {
    connection = {
      host: process.env.TEST_DB_HOST,
      port: Number(process.env.TEST_DB_PORT ?? 3306),
      user: process.env.TEST_DB_USER ?? 'root',
      password: process.env.TEST_DB_PASSWORD ?? '',
      database: process.env.TEST_DB_NAME ?? 'agrabudi_test',
    };
  } else {
    server = await createDB({ version: '8.4.x', dbName: 'agrabudi_test', logLevel: 'ERROR' });
    connection = {
      host: '127.0.0.1',
      port: server.port,
      user: server.username,
      password: '',
      database: server.dbName,
    };
  }
  const db = createDb({
    DB_HOST: connection.host,
    DB_PORT: connection.port,
    DB_USER: connection.user,
    DB_PASSWORD: connection.password,
    DB_NAME: connection.database,
    DB_TLS: 'off',
    DB_TLS_CA_FILE: undefined,
    DB_POOL_MAX: 5,
    DB_CONNECT_TIMEOUT_MS: 5000,
  });
  try {
    await migrateToLatest(db);
  } finally {
    await db.destroy();
  }
  project.provide('mysql', connection);
  return async () => {
    await server?.stop();
  };
}
