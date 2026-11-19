import {
  createHash,
  randomBytes,
  randomInt,
  scrypt,
  timingSafeEqual,
  type ScryptOptions,
} from 'node:crypto';

/**
 * Hash kata sandi dengan scrypt dari modul crypto Node (dipelihara bersama runtime, tanpa
 * dependency native tambahan). Parameter N=2^15, r=8, p=1 mengikuti rekomendasi minimum
 * OWASP untuk scrypt. Format: scrypt$N$r$p$salt$hash (base64url).
 */
const PARAMS = { N: 2 ** 15, r: 8, p: 1 } as const;
const KEY_LENGTH = 64;
const MAX_MEMORY = 128 * PARAMS.N * PARAMS.r * 2;

function derive(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, options, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, { ...PARAMS, maxmem: MAX_MEMORY });
  return [
    'scrypt',
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString('base64url'),
    key.toString('base64url'),
  ].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, saltText, keyText] = parts as [string, string, string, string, string, string];
  const N = Number(n);
  const rr = Number(r);
  const pp = Number(p);
  if (![N, rr, pp].every(Number.isSafeInteger)) return false;
  const expected = Buffer.from(keyText, 'base64url');
  const actual = await derive(password, Buffer.from(saltText, 'base64url'), {
    N,
    r: rr,
    p: pp,
    maxmem: 128 * N * rr * 2,
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/**
 * Hash pengganti untuk akun yang tidak ada, supaya waktu respons login tidak membedakan
 * "username salah" dan "kata sandi salah".
 */
let dummyHash: Promise<string> | undefined;
export function dummyPasswordHash(): Promise<string> {
  dummyHash ??= hashPassword(randomBytes(16).toString('hex'));
  return dummyHash;
}

/** Tanpa huruf/angka yang mirip (0/O, 1/l/I) supaya kata sandi dari WhatsApp mudah diketik di HP. */
const TEMP_ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Kata sandi sementara untuk akun baru atau reset oleh admin: 3 kelompok x 4 karakter acak
 * (sekitar 69 bit), mis. `Kx7m-Pq4r-Zt9w`. Selalu ditandai wajib diganti saat login.
 */
export function generateTemporaryPassword(): string {
  const group = () =>
    Array.from({ length: 4 }, () => TEMP_ALPHABET[randomInt(TEMP_ALPHABET.length)]).join('');
  return [group(), group(), group()].join('-');
}

/** Kode reset 6 angka. Yang disimpan hanya hash-nya, terikat ke akun. */
export function generateResetCode(): string {
  return String(randomInt(1_000_000)).padStart(6, '0');
}

export function hashResetCode(accountId: string, code: string): string {
  return createHash('sha256').update(`${accountId}:${code}`).digest('hex');
}

/** Bandingkan hash heksadesimal dengan waktu tetap. */
export function sameHash(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length === right.length && left.length > 0 && timingSafeEqual(left, right);
}
