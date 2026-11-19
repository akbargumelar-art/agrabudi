import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { BusinessUnit, DataScope, StaffPermission, StaffRole } from '@agrabudi/contracts';
import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import { sql } from 'kysely';
import { inject } from 'vitest';
import { buildApp } from '../src/app';
import { loadConfig, type AppConfig } from '../src/config';
import { createDb, type Db } from '../src/db/database';
import { up as seedSitePages } from '../src/db/migrations/0002_site_pages';
import { newId } from '../src/lib/ids';
import { hashPassword } from '../src/lib/password';
import { createLocalStorage } from '../src/lib/storage';
import type { WaSender } from '../src/lib/waha';

export const ORIGIN = {
  public: 'https://agrabudi.test',
  outlet: 'https://outlet.agrabudi.test',
  portal: 'https://portal.agrabudi.test',
} as const;

export const PASSWORD = 'kata-sandi-uji-123';

export type TestContext = {
  app: FastifyInstance;
  db: Db;
  config: AppConfig;
  close: () => Promise<void>;
};

/** Pengirim WhatsApp tiruan: mencatat pesan, tidak pernah menghubungi WAHA. */
export type FakeWa = WaSender & { sent: { chatId: string; text: string }[]; fail: boolean };

export function fakeWa(): FakeWa {
  const fake: FakeWa = {
    sent: [],
    fail: false,
    async sendText(chatId, text) {
      if (fake.fail) throw new Error('WAHA menjawab status 500.');
      fake.sent.push({ chatId, text });
    },
  };
  return fake;
}

export async function createTestContext(
  overrides: Partial<Record<string, string>> = {},
  wa: WaSender | null = null,
): Promise<TestContext> {
  const mysql = inject('mysql');
  const storageDir = mkdtempSync(join(tmpdir(), 'abk-api-test-'));
  const config = loadConfig({
    NODE_ENV: 'test',
    DB_HOST: mysql.host,
    DB_PORT: String(mysql.port),
    DB_USER: mysql.user,
    DB_PASSWORD: mysql.password,
    DB_NAME: mysql.database,
    DB_TLS: 'off',
    APP_URL_PUBLIC: ORIGIN.public,
    APP_URL_OUTLET: ORIGIN.outlet,
    APP_URL_PORTAL: ORIGIN.portal,
    COOKIE_SECURE: 'true',
    STORAGE_DIR: storageDir,
    MEDIA_PUBLIC_BASE_URL: `${ORIGIN.public}/media`,
    RATE_LIMIT_ENABLED: 'false',
    ...overrides,
  });
  const db = createDb(config);
  const storage = createLocalStorage(config.STORAGE_DIR, config.MEDIA_PUBLIC_BASE_URL);
  const app = await buildApp({ config, db, storage, wa });
  return {
    app,
    db,
    config,
    close: async () => {
      await app.close();
      await db.destroy();
      rmSync(storageDir, { recursive: true, force: true });
    },
  };
}

/** Kosongkan semua tabel data (skema tetap), lalu isi ulang daftar halaman bawaan migrasi. */
export async function resetDatabase(db: Db) {
  const raw = db.withoutPlugins();
  const tables = await sql<{ name: string }>`
    SELECT table_name AS name FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name NOT LIKE 'schema_migrations%'`.execute(raw);
  await sql`SET FOREIGN_KEY_CHECKS = 0`.execute(raw);
  try {
    for (const { name } of tables.rows) await sql.raw(`TRUNCATE TABLE \`${name}\``).execute(raw);
  } finally {
    await sql`SET FOREIGN_KEY_CHECKS = 1`.execute(raw);
  }
  await seedSitePages(raw);
}

/** Satu hash untuk semua akun uji supaya tes tidak lambat karena scrypt. */
let passwordHash: Promise<string> | undefined;
const testHash = () => (passwordHash ??= hashPassword(PASSWORD));

export async function createStaff(
  db: Db,
  input: {
    username: string;
    role: StaffRole;
    unit?: BusinessUnit | null;
    scope?: DataScope;
    permissions?: StaffPermission[];
    status?: 'active' | 'disabled';
  },
) {
  const id = newId();
  await db
    .insertInto('staffAccounts')
    .values({
      id,
      username: input.username,
      displayName: `Akun uji ${input.username}`,
      email: null,
      phone: null,
      role: input.role,
      unit: input.unit ?? null,
      scope: input.scope ?? (input.role === 'web_admin' ? 'site' : 'cluster'),
      passwordHash: await testHash(),
      status: input.status ?? 'active',
    })
    .execute();
  for (const permission of input.permissions ?? []) {
    await db.insertInto('staffPermissions').values({ accountId: id, permission }).execute();
  }
  return id;
}

export async function createOutlet(db: Db, digiposId: string) {
  const id = newId();
  await db
    .insertInto('outletAccounts')
    .values({
      id,
      digiposId,
      outletName: `Outlet uji ${digiposId}`,
      ownerName: 'Pemilik uji',
      tap: null,
      registeredAt: '2026-01-02',
      salesforceName: null,
      photoUrl: null,
      passwordHash: await testHash(),
    })
    .execute();
  return id;
}

/** Ubah Set-Cookie respons menjadi header Cookie untuk permintaan berikutnya. */
export function cookieHeader(response: LightMyRequestResponse): string {
  return response.cookies
    .filter((cookie) => cookie.value !== '')
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');
}

export async function loginStaff(app: FastifyInstance, username: string): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    headers: { origin: ORIGIN.portal },
    payload: { username, password: PASSWORD },
  });
  if (response.statusCode !== 200) throw new Error(`login ${username} gagal: ${response.body}`);
  return cookieHeader(response);
}

export async function loginOutlet(app: FastifyInstance, digiposId: string): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/outlet/auth/login',
    headers: { origin: ORIGIN.outlet },
    payload: { digiposId, password: PASSWORD },
  });
  if (response.statusCode !== 200)
    throw new Error(`login outlet ${digiposId} gagal: ${response.body}`);
  return cookieHeader(response);
}

export const idemKey = () => newId().replaceAll('-', '');

/** PDF minimal yang sah untuk tes unggah CV. */
export const SAMPLE_PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
/** PNG 1x1. */
export const SAMPLE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

/** Bangun body multipart sederhana untuk app.inject. */
export function multipart(
  fields: Record<string, string>,
  file?: { field: string; name: string; type: string; data: Buffer },
) {
  const boundary = `----abkuji${newId().replaceAll('-', '')}`;
  const chunks: Buffer[] = [];
  for (const [name, value] of Object.entries(fields)) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
      ),
    );
  }
  if (file) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${file.field}"; filename="${file.name}"\r\nContent-Type: ${file.type}\r\n\r\n`,
      ),
      file.data,
      Buffer.from('\r\n'),
    );
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return {
    payload: Buffer.concat(chunks),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}
