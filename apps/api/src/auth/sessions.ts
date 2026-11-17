import { createHash } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Kysely } from 'kysely';
import { SESSION_POLICY } from '../config';
import type { Database, SessionRealm } from '../db/types';
import { sessionToken } from '../lib/ids';

/**
 * Sesi server per realm (PRD 4.3). Cookie host-only, HttpOnly, SameSite=Strict; tidak ada
 * Domain=.agrabudi.id. Sesi Web Admin punya cookie dan path sendiri; API staff dan CMS
 * masing-masing hanya membaca cookie realm-nya, jadi cookie salah realm diabaikan.
 */
type CookieSpec = { name: string; path: string };

export function cookieSpec(realm: SessionRealm, secure: boolean): CookieSpec {
  switch (realm) {
    case 'staff':
      return { name: secure ? '__Host-abk_staff' : 'abk_staff', path: '/' };
    case 'outlet':
      return { name: secure ? '__Host-abk_outlet' : 'abk_outlet', path: '/' };
    case 'web_admin':
      return { name: secure ? '__Secure-abk_webadmin' : 'abk_webadmin', path: '/web-admin' };
  }
}

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/** Jangan menulis last_seen_at pada setiap permintaan; cukup bila sudah lewat 60 detik. */
const TOUCH_AFTER_MS = 60_000;

export async function createSession(
  db: Kysely<Database>,
  realm: SessionRealm,
  accountId: string,
): Promise<{ token: string; maxAgeSeconds: number }> {
  const policy = SESSION_POLICY[realm];
  const token = sessionToken();
  const now = new Date();
  await db
    .insertInto('sessions')
    .values({
      tokenHash: hashToken(token),
      realm,
      accountId,
      lastSeenAt: now,
      expiresAt: new Date(now.getTime() + policy.maxSeconds * 1000),
      idleSeconds: policy.idleSeconds,
      revokedAt: null,
    })
    .execute();
  return { token, maxAgeSeconds: policy.maxSeconds };
}

/** ID akun pemilik sesi bila sesi masih sah untuk realm ini; selain itu `null`. */
export async function resolveSession(
  db: Kysely<Database>,
  realm: SessionRealm,
  token: string,
): Promise<string | null> {
  if (token.length < 20 || token.length > 100) return null;
  const tokenHash = hashToken(token);
  const row = await db
    .selectFrom('sessions')
    .select(['accountId', 'lastSeenAt', 'expiresAt', 'idleSeconds', 'revokedAt', 'realm'])
    .where('tokenHash', '=', tokenHash)
    .executeTakeFirst();
  if (!row || row.realm !== realm || row.revokedAt !== null) return null;
  const now = Date.now();
  if (row.expiresAt.getTime() <= now) return null;
  if (row.lastSeenAt.getTime() + row.idleSeconds * 1000 <= now) return null;
  if (now - row.lastSeenAt.getTime() > TOUCH_AFTER_MS) {
    await db
      .updateTable('sessions')
      .set({ lastSeenAt: new Date(now) })
      .where('tokenHash', '=', tokenHash)
      .execute();
  }
  return row.accountId;
}

export async function revokeSession(db: Kysely<Database>, token: string) {
  await db
    .updateTable('sessions')
    .set({ revokedAt: new Date() })
    .where('tokenHash', '=', hashToken(token))
    .where('revokedAt', 'is', null)
    .execute();
}

/** Cabut semua sesi satu akun, mis. saat akun dinonaktifkan atau kata sandi diganti. */
export async function revokeAccountSessions(
  db: Kysely<Database>,
  realm: SessionRealm,
  accountId: string,
) {
  await db
    .updateTable('sessions')
    .set({ revokedAt: new Date() })
    .where('realm', '=', realm)
    .where('accountId', '=', accountId)
    .where('revokedAt', 'is', null)
    .execute();
}

export function readSessionCookie(
  request: FastifyRequest,
  realm: SessionRealm,
  secure: boolean,
): string | null {
  const value = request.cookies[cookieSpec(realm, secure).name];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function setSessionCookie(
  reply: FastifyReply,
  realm: SessionRealm,
  secure: boolean,
  token: string,
  maxAgeSeconds: number,
) {
  const spec = cookieSpec(realm, secure);
  reply.setCookie(spec.name, token, {
    path: spec.path,
    httpOnly: true,
    secure,
    sameSite: 'strict',
    maxAge: maxAgeSeconds,
  });
}

export function clearSessionCookie(reply: FastifyReply, realm: SessionRealm, secure: boolean) {
  const spec = cookieSpec(realm, secure);
  reply.clearCookie(spec.name, { path: spec.path, httpOnly: true, secure, sameSite: 'strict' });
}
