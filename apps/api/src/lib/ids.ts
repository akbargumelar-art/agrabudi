import { randomBytes, randomInt, randomUUID } from 'node:crypto';

export const newId = (): string => randomUUID();

/** Huruf tanpa 0/O/1/I supaya nomor referensi mudah dibacakan lewat telepon. */
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function randomCode(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

function datePart(now: Date): string {
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().slice(2, 10).replaceAll('-', '');
}

/**
 * Nomor yang ditunjukkan ke pengguna: tanggal WIB + kode acak, bukan nomor urut
 * yang bisa ditebak (PRD 4.5). Akses tetap diperiksa terhadap pemilik, bukan nomor.
 */
export function referenceNumber(prefix: string, now = new Date()): string {
  return `${prefix}-${datePart(now)}-${randomCode(6)}`;
}

/** Token sesi: 256 bit acak. Yang disimpan di DB hanya hash-nya. */
export function sessionToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Slug dari judul: huruf kecil, angka, dan tanda hubung. */
export function slugify(text: string): string {
  const base = text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
  return base || 'item';
}
