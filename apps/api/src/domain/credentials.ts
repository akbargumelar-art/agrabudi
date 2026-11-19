import {
  PASSWORD_RESET_CODE_TTL_MINUTES,
  PASSWORD_RESET_MAX_ATTEMPTS,
  maskPhone,
  type CredentialDelivery,
} from '@agrabudi/contracts';
import type { FastifyBaseLogger } from 'fastify';
import type { Db } from '../db/database';
import type { PasswordResetRealm, SessionRealm } from '../db/types';
import { HttpError, invalid } from '../lib/errors';
import { newId } from '../lib/ids';
import {
  generateResetCode,
  generateTemporaryPassword,
  hashPassword,
  hashResetCode,
  sameHash,
  verifyPassword,
} from '../lib/password';
import { phoneToChatId, type WaSender } from '../lib/waha';

/**
 * Siklus kata sandi di satu tempat (AS-12): ganti sendiri, reset mandiri lewat kode WhatsApp,
 * dan kata sandi sementara dari admin. Kata sandi dan kode tidak pernah masuk log atau audit.
 */

/** Kode baru per akun dibatasi supaya nomor WhatsApp pemilik tidak dibanjiri pesan. */
const MAX_CODES_PER_HOUR = 3;

export const waUnavailable = () =>
  new HttpError(
    503,
    'SERVICE_UNAVAILABLE',
    'Pengiriman WhatsApp belum aktif di server. Hubungi pengelola akses.',
  );

const waFailed = () =>
  new HttpError(
    503,
    'SERVICE_UNAVAILABLE',
    'Pesan WhatsApp gagal dikirim, jadi tidak ada yang diubah. Coba lagi beberapa saat.',
  );

const resetRejected = () =>
  invalid('Kode salah atau sudah tidak berlaku. Minta kode baru bila perlu.', {
    code: 'Kode salah atau sudah tidak berlaku.',
  });

type Account = {
  id: string;
  phone: string | null;
  status: 'active' | 'disabled';
  passwordHash: string;
};

/** Akun dari username Portal (huruf kecil) atau ID Digipos (huruf besar). */
async function findAccount(
  db: Db,
  realm: PasswordResetRealm,
  identifier: string,
): Promise<Account | undefined> {
  if (realm === 'staff') {
    return db
      .selectFrom('staffAccounts')
      .select(['id', 'phone', 'status', 'passwordHash'])
      .where('username', '=', identifier.trim().toLowerCase())
      .executeTakeFirst();
  }
  return db
    .selectFrom('outletAccounts')
    .select(['id', 'phone', 'status', 'passwordHash'])
    .where('digiposId', '=', identifier.trim().toUpperCase())
    .executeTakeFirst();
}

async function setPassword(
  db: Db,
  realm: PasswordResetRealm,
  accountId: string,
  passwordHash: string,
  mustChangePassword: boolean,
) {
  const values = {
    passwordHash,
    mustChangePassword,
    passwordChangedAt: mustChangePassword ? null : new Date(),
  };
  if (realm === 'staff') {
    await db.updateTable('staffAccounts').set(values).where('id', '=', accountId).execute();
  } else {
    await db.updateTable('outletAccounts').set(values).where('id', '=', accountId).execute();
  }
}

/** Realm sesi yang mungkin dimiliki akun di tabel ini. Akun staff bisa staff atau web_admin. */
function sessionRealmsOf(realm: PasswordResetRealm): SessionRealm[] {
  return realm === 'staff' ? ['staff', 'web_admin'] : ['outlet'];
}

/** Cabut semua sesi akun, mis. setelah kata sandi diganti atau akun dinonaktifkan. */
export async function revokeAllSessions(db: Db, realm: PasswordResetRealm, accountId: string) {
  await db
    .updateTable('sessions')
    .set({ revokedAt: new Date() })
    .where('realm', 'in', sessionRealmsOf(realm))
    .where('accountId', '=', accountId)
    .where('revokedAt', 'is', null)
    .execute();
}

/**
 * Ganti kata sandi oleh pemilik akun. Kata sandi lama wajib benar, termasuk saat mengganti
 * kata sandi sementara. Semua sesi dicabut; pemanggil membuat sesi baru untuk browser ini.
 */
export async function changeOwnPassword(
  db: Db,
  realm: PasswordResetRealm,
  accountId: string,
  currentPassword: string,
  newPassword: string,
) {
  const row =
    realm === 'staff'
      ? await db
          .selectFrom('staffAccounts')
          .select('passwordHash')
          .where('id', '=', accountId)
          .executeTakeFirstOrThrow()
      : await db
          .selectFrom('outletAccounts')
          .select('passwordHash')
          .where('id', '=', accountId)
          .executeTakeFirstOrThrow();
  if (!(await verifyPassword(currentPassword, row.passwordHash))) {
    throw invalid('Kata sandi saat ini salah.', { currentPassword: 'Kata sandi saat ini salah.' });
  }
  await setPassword(db, realm, accountId, await hashPassword(newPassword), false);
  await revokeAllSessions(db, realm, accountId);
}

/**
 * Langkah 1 reset mandiri. Jawabannya selalu sama, ada atau tidak ada akunnya dan punya nomor
 * WhatsApp atau tidak (anti-enumerasi). Pengiriman tidak ditunggu supaya waktu respons juga
 * tidak membocorkan keberadaan akun; kegagalan hanya masuk log tanpa nomor dan kode.
 */
export async function requestPasswordReset(
  db: Db,
  wa: WaSender,
  log: FastifyBaseLogger,
  realm: PasswordResetRealm,
  identifier: string,
  appName: string,
): Promise<void> {
  const account = await findAccount(db, realm, identifier);
  const chatId = account?.phone ? phoneToChatId(account.phone) : null;
  if (!account || account.status !== 'active' || !chatId) {
    log.info({ event: 'password_reset_skipped', realm }, 'reset kata sandi tidak dikirim');
    return;
  }
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await db
    .selectFrom('passwordResetCodes')
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .where('realm', '=', realm)
    .where('accountId', '=', account.id)
    .where('createdAt', '>', hourAgo)
    .executeTakeFirstOrThrow();
  if (Number(recent.count) >= MAX_CODES_PER_HOUR) {
    log.info({ event: 'password_reset_throttled', realm }, 'batas kode reset per jam tercapai');
    return;
  }
  const code = generateResetCode();
  const now = new Date();
  // Hanya kode terakhir yang berlaku.
  await db
    .updateTable('passwordResetCodes')
    .set({ usedAt: now })
    .where('realm', '=', realm)
    .where('accountId', '=', account.id)
    .where('usedAt', 'is', null)
    .execute();
  await db
    .insertInto('passwordResetCodes')
    .values({
      id: newId(),
      realm,
      accountId: account.id,
      codeHash: hashResetCode(account.id, code),
      expiresAt: new Date(now.getTime() + PASSWORD_RESET_CODE_TTL_MINUTES * 60 * 1000),
      usedAt: null,
    })
    .execute();
  const text =
    `Kode reset kata sandi ${appName}: ${code}. Berlaku ${PASSWORD_RESET_CODE_TTL_MINUTES} menit. ` +
    'Jangan berikan kode ini kepada siapa pun, termasuk petugas Agrabudi.';
  void wa.sendText(chatId, text).catch((error: unknown) => {
    log.warn(
      {
        event: 'password_reset_wa_failed',
        realm,
        reason: error instanceof Error ? error.message : 'unknown',
      },
      'kode reset gagal dikirim lewat WhatsApp',
    );
  });
}

/**
 * Langkah 2 reset mandiri. Kode salah menambah hitungan percobaan dan gugur setelah batasnya.
 * Berhasil = kata sandi baru dari pengguna sendiri (tidak wajib diganti lagi), semua sesi
 * dicabut. Mengembalikan ID akun untuk audit.
 */
export async function confirmPasswordReset(
  db: Db,
  realm: PasswordResetRealm,
  identifier: string,
  code: string,
  newPassword: string,
): Promise<string> {
  const account = await findAccount(db, realm, identifier);
  if (!account || account.status !== 'active') throw resetRejected();
  const pending = await db
    .selectFrom('passwordResetCodes')
    .selectAll()
    .where('realm', '=', realm)
    .where('accountId', '=', account.id)
    .where('usedAt', 'is', null)
    .where('expiresAt', '>', new Date())
    .orderBy('createdAt', 'desc')
    .executeTakeFirst();
  if (!pending || pending.attempts >= PASSWORD_RESET_MAX_ATTEMPTS) throw resetRejected();
  if (!sameHash(pending.codeHash, hashResetCode(account.id, code))) {
    const attempts = pending.attempts + 1;
    await db
      .updateTable('passwordResetCodes')
      .set(
        attempts >= PASSWORD_RESET_MAX_ATTEMPTS ? { attempts, usedAt: new Date() } : { attempts },
      )
      .where('id', '=', pending.id)
      .execute();
    throw resetRejected();
  }
  const passwordHash = await hashPassword(newPassword);
  await db.transaction().execute(async (trx) => {
    // Kode dipakai sekali: hanya satu permintaan yang berhasil menandainya terpakai.
    const claimed = await trx
      .updateTable('passwordResetCodes')
      .set({ usedAt: new Date() })
      .where('id', '=', pending.id)
      .where('usedAt', 'is', null)
      .executeTakeFirst();
    if (Number(claimed.numUpdatedRows) !== 1) throw resetRejected();
    await setPassword(trx, realm, account.id, passwordHash, false);
    await revokeAllSessions(trx, realm, account.id);
  });
  return account.id;
}

/**
 * Kata sandi sementara dari admin (akun baru atau reset). `persist` menyimpan perubahan di
 * transaksi yang sama, dan WhatsApp dikirim sebelum commit. Bila WAHA gagal, tidak ada yang
 * berubah, sehingga tidak ada akun dengan kata sandi yang tidak diketahui siapa pun.
 */
export async function issueTemporaryPassword(
  db: Db,
  wa: WaSender | null,
  phone: string,
  message: (password: string) => string,
  persist: (trx: Db, passwordHash: string) => Promise<void>,
): Promise<CredentialDelivery> {
  if (!wa) throw waUnavailable();
  const chatId = phoneToChatId(phone);
  if (!chatId) {
    throw invalid('Nomor WhatsApp pemilik akun belum benar.', {
      phone: 'Nomor HP diawali 08 atau +628.',
    });
  }
  const password = generateTemporaryPassword();
  const passwordHash = await hashPassword(password);
  await db.transaction().execute(async (trx) => {
    await persist(trx, passwordHash);
    try {
      await wa.sendText(chatId, message(password));
    } catch {
      throw waFailed();
    }
  });
  return { channel: 'whatsapp', maskedPhone: maskPhone(phone) };
}

/** Isi pesan kata sandi sementara. Tidak memuat data lain selain yang perlu untuk masuk. */
export function temporaryPasswordMessage(
  appName: string,
  loginId: string,
  appUrl: string,
  reason: 'created' | 'reset',
) {
  return (password: string) =>
    `${reason === 'created' ? 'Akun' : 'Kata sandi akun'} ${appName} Anda ${reason === 'created' ? 'sudah dibuat' : 'sudah direset'}.\n` +
    `Login: ${loginId}\nKata sandi sementara: ${password}\nMasuk di ${appUrl} lalu ganti kata sandi saat diminta. ` +
    'Jangan bagikan pesan ini.';
}

