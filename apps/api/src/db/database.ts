import { readFileSync } from 'node:fs';
import { CamelCasePlugin, Kysely, MysqlDialect } from 'kysely';
import { createPool, type PoolOptions } from 'mysql2';
import type { AppConfig } from '../config';
import type { Database } from './types';

export type Db = Kysely<Database>;

type DbConnectionConfig = Pick<
  AppConfig,
  | 'DB_HOST'
  | 'DB_PORT'
  | 'DB_USER'
  | 'DB_PASSWORD'
  | 'DB_NAME'
  | 'DB_TLS'
  | 'DB_TLS_CA_FILE'
  | 'DB_POOL_MAX'
  | 'DB_CONNECT_TIMEOUT_MS'
>;

/**
 * Satu pool per proses (PRD 4.10). Waktu disimpan UTC; kolom DATE dibaca sebagai teks
 * supaya tanggal periode tidak bergeser zona waktu; TINYINT(1) dibaca sebagai boolean.
 */
export function poolOptions(config: DbConnectionConfig): PoolOptions {
  return {
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    connectionLimit: config.DB_POOL_MAX,
    // Antrean pool dibatasi: saat DB lambat, permintaan gagal cepat (503), bukan menumpuk tanpa batas.
    queueLimit: config.DB_POOL_MAX * 10,
    connectTimeout: config.DB_CONNECT_TIMEOUT_MS,
    waitForConnections: true,
    charset: 'UTF8MB4_UNICODE_CI',
    timezone: 'Z',
    dateStrings: ['DATE'],
    supportBigNumbers: true,
    decimalNumbers: true,
    // Verifikasi CA dan nama host; tidak ada rejectUnauthorized=false (PRD 4.9).
    ssl:
      config.DB_TLS === 'verify' && config.DB_TLS_CA_FILE
        ? { ca: readFileSync(config.DB_TLS_CA_FILE, 'utf8'), rejectUnauthorized: true }
        : undefined,
    typeCast(field, next) {
      if (field.type === 'TINY' && field.length === 1) {
        const value = field.string();
        return value === null ? null : value === '1';
      }
      return next();
    },
  };
}

export function createDb(config: DbConnectionConfig): Db {
  return new Kysely<Database>({
    dialect: new MysqlDialect({ pool: createPool(poolOptions(config)) }),
    plugins: [new CamelCasePlugin()],
  });
}

/** Kode error mysql2 yang berarti database tidak bisa dijangkau atau kehabisan koneksi. */
const UNAVAILABLE_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EHOSTUNREACH',
  'PROTOCOL_CONNECTION_LOST',
  'ER_CON_COUNT_ERROR',
  'ER_TOO_MANY_USER_CONNECTIONS',
  'POOL_ENQUEUELIMIT',
  'POOL_CLOSED',
]);

export function isDbUnavailable(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const code = (error as { code?: unknown }).code;
  if (typeof code === 'string' && UNAVAILABLE_CODES.has(code)) return true;
  // Pool mysql2 melempar Error biasa saat antrean penuh.
  return error instanceof Error && /Queue limit reached/i.test(error.message);
}

export function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === 'ER_DUP_ENTRY'
  );
}
