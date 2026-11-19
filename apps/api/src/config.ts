import { z } from 'zod';

/**
 * Konfigurasi API dari environment. Nilai rahasia (kata sandi DB) hanya datang dari
 * environment server, tidak pernah dari repo. Server menolak start bila isian tidak sah,
 * supaya salah konfigurasi ketahuan saat deploy, bukan saat transaksi pertama.
 */
const bool = z.enum(['true', 'false']).transform((value) => value === 'true');
const positiveInt = z.coerce.number().int().positive();
const emptyAsUnset = (value: unknown) => (value === '' ? undefined : value);

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    HOST: z.string().default('0.0.0.0'),
    PORT: positiveInt.default(4000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    /** Nilai `trustProxy` Fastify: "false", "true", atau daftar IP/CIDR reverse proxy dipisah koma. */
    TRUST_PROXY: z.string().default('false'),

    DB_HOST: z.string().min(1),
    DB_PORT: positiveInt.default(3306),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().default(''),
    DB_NAME: z.string().regex(/^[A-Za-z0-9_]+$/),
    /** `verify` = TLS dengan verifikasi CA dan nama host (PRD 4.9). `off` hanya untuk lokal atau jaringan privat yang disetujui. */
    DB_TLS: z.enum(['verify', 'off']),
    DB_TLS_CA_FILE: z.string().optional(),
    DB_POOL_MAX: positiveInt.default(10),
    DB_CONNECT_TIMEOUT_MS: positiveInt.default(5000),

    /** Origin tiga aplikasi. Dipakai untuk pemeriksaan Origin pada aksi yang mengubah data. */
    APP_URL_PUBLIC: z.url(),
    APP_URL_OUTLET: z.url(),
    APP_URL_PORTAL: z.url(),
    /** `false` hanya untuk pengembangan lokal lewat http. Produksi wajib `true`. */
    COOKIE_SECURE: bool.default(true),

    STORAGE_DIR: z.string().min(1),
    /** URL dasar berkas publik (banner, aset), mis. https://agrabudi.id/media */
    MEDIA_PUBLIC_BASE_URL: z.url(),

    /** Masa berlaku quote Outlet. Nilai final mengikuti SOP order (PRD 2.7: TBD). */
    QUOTE_TTL_MINUTES: positiveInt.default(15),
    /** Batas laju login, form, dan order. Hanya boleh `false` di tes otomatis. */
    RATE_LIMIT_ENABLED: bool.default(true),

    /** WAHA dikelola operator; browser tidak boleh menetapkan host atau melihat kunci. */
    /** Baris kosong di env file (`WAHA_BASE_URL=`) berarti tidak diisi, bukan URL salah. */
    WAHA_BASE_URL: z.preprocess(emptyAsUnset, z.url({ protocol: /^https?$/ }).optional()),
    WAHA_API_KEY: z.preprocess(emptyAsUnset, z.string().min(1).optional()),
    WAHA_SESSION: z
      .string()
      .regex(/^[A-Za-z0-9_-]{1,80}$/)
      .default('default'),
  })
  .superRefine((env, ctx) => {
    if (Boolean(env.WAHA_BASE_URL) !== Boolean(env.WAHA_API_KEY)) {
      ctx.addIssue({
        code: 'custom',
        path: ['WAHA_BASE_URL'],
        message: 'Isi WAHA_BASE_URL dan WAHA_API_KEY bersamaan.',
      });
    }
    if (env.WAHA_BASE_URL) {
      const url = URL.parse(env.WAHA_BASE_URL);
      if (url && (url.username || url.password || url.search || url.hash || url.pathname !== '/')) {
        ctx.addIssue({
          code: 'custom',
          path: ['WAHA_BASE_URL'],
          message: 'Isi origin WAHA saja, tanpa path, kredensial, query, atau fragmen.',
        });
      }
    }
    if (env.DB_TLS === 'verify' && !env.DB_TLS_CA_FILE) {
      ctx.addIssue({
        code: 'custom',
        path: ['DB_TLS_CA_FILE'],
        message: 'Wajib diisi bila DB_TLS=verify.',
      });
    }
    if (env.NODE_ENV === 'production' && !env.COOKIE_SECURE) {
      ctx.addIssue({
        code: 'custom',
        path: ['COOKIE_SECURE'],
        message: 'Produksi wajib memakai cookie Secure.',
      });
    }
    if (env.NODE_ENV === 'production' && !env.RATE_LIMIT_ENABLED) {
      ctx.addIssue({
        code: 'custom',
        path: ['RATE_LIMIT_ENABLED'],
        message: 'Produksi wajib memakai batas laju.',
      });
    }
  });

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    // Hanya nama variabel dan alasannya, tidak pernah nilainya.
    const problems = parsed.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`,
    );
    throw new Error(`Konfigurasi API tidak sah:\n- ${problems.join('\n- ')}`);
  }
  return parsed.data;
}

/** Ubah TRUST_PROXY ke bentuk yang diterima Fastify: true, false, atau daftar IP/CIDR proxy. */
export function trustProxyValue(raw: string): boolean | string[] {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Kebijakan sesi per realm. PRD 4.3: Web Admin idle 30 menit, maksimum 8 jam. Lainnya usulan awal. */
export const SESSION_POLICY = {
  staff: { idleSeconds: 2 * 60 * 60, maxSeconds: 12 * 60 * 60 },
  web_admin: { idleSeconds: 30 * 60, maxSeconds: 8 * 60 * 60 },
  outlet: { idleSeconds: 24 * 60 * 60, maxSeconds: 30 * 24 * 60 * 60 },
} as const;
