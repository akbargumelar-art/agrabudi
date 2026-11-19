import { staffLoginSchema, staffProfileUpdateSchema, type StaffSession } from '@agrabudi/contracts';
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { authenticateStaff, staffSessionFromRow, type StaffPrincipal } from '../auth/principals';
import {
  clearSessionCookie,
  createSession,
  readSessionCookie,
  revokeSession,
  setSessionCookie,
} from '../auth/sessions';
import type { Db } from '../db/database';
import type { SessionRealm } from '../db/types';
import { audit } from '../lib/audit';
import { HttpError } from '../lib/errors';
import { parse } from '../lib/http';
import { dummyPasswordHash, verifyPassword } from '../lib/password';
import {
  PASSWORD_CHANGE_RATE,
  RESET_CONFIRM_RATE,
  RESET_REQUEST_RATE,
  handlePasswordChange,
  handleResetConfirm,
  handleResetRequest,
} from './password';

/** 10 percobaan login per IP per 5 menit (PRD 4.3, 4.13). */
export const LOGIN_RATE = { rateLimit: { max: 10, timeWindow: '5 minutes' } };

const invalidCredentials = () =>
  new HttpError(401, 'UNAUTHENTICATED', 'Username atau kata sandi salah.');

/** Ubah nama, email, dan nomor HP. Username, peran, unit, dan cakupan tidak ikut (mass assignment). */
export async function updateOwnProfile(
  db: Db,
  principal: StaffPrincipal,
  body: unknown,
  requestId: string,
): Promise<StaffSession> {
  const { displayName, email, phone } = parse(staffProfileUpdateSchema, body);
  await db
    .updateTable('staffAccounts')
    .set({ displayName, email, phone })
    .where('id', '=', principal.session.accountId)
    .execute();
  await audit(db, {
    actor: principal.actor,
    action: 'account.profile.update',
    objectType: 'staff_account',
    objectId: principal.session.accountId,
    objectLabel: principal.session.username,
    requestId,
  });
  const row = await db
    .selectFrom('staffAccounts')
    .selectAll()
    .where('id', '=', principal.session.accountId)
    .executeTakeFirstOrThrow();
  return staffSessionFromRow(db, row);
}

export async function logout(request: FastifyRequest, reply: FastifyReply, realm: SessionRealm) {
  const { db, config } = request.server.deps;
  const token = readSessionCookie(request, realm, config.COOKIE_SECURE);
  if (token) await revokeSession(db, token);
  clearSessionCookie(reply, realm, config.COOKIE_SECURE);
  return reply.code(204).send();
}

/**
 * Login Portal (/api/v1/auth). Satu form untuk semua peran; peran ditentukan server dari
 * akun. Akun Admin Web mendapat sesi realm `web_admin` dengan cookie dan path sendiri
 * (/web-admin), idle 30 menit, dan tidak pernah bisa memakai API operasional (PRD 4.3).
 */
export const staffAuthRoutes: FastifyPluginAsync = async (app) => {
  const { db, config } = app.deps;

  app.post('/auth/login', { config: LOGIN_RATE }, async (request, reply) => {
    const { username, password } = parse(staffLoginSchema, request.body);
    const row = await db
      .selectFrom('staffAccounts')
      .selectAll()
      .where('username', '=', username)
      .executeTakeFirst();
    const valid = await verifyPassword(password, row?.passwordHash ?? (await dummyPasswordHash()));
    if (!row || !valid || row.status !== 'active') {
      request.log.info({ event: 'login_failed', realm: 'staff' }, 'login gagal');
      throw invalidCredentials();
    }
    const realm: SessionRealm = row.role === 'web_admin' ? 'web_admin' : 'staff';
    // Sesi lama di browser ini dicabut; tidak ada sesi ganda dari satu cookie jar.
    for (const candidate of ['staff', 'web_admin'] as const) {
      const old = readSessionCookie(request, candidate, config.COOKIE_SECURE);
      if (old) await revokeSession(db, old);
      if (candidate !== realm) clearSessionCookie(reply, candidate, config.COOKIE_SECURE);
    }
    const { token, maxAgeSeconds } = await createSession(db, realm, row.id);
    setSessionCookie(reply, realm, config.COOKIE_SECURE, token, maxAgeSeconds);
    await audit(db, {
      actor: { realm, id: row.id, label: row.username },
      action: 'auth.login',
      objectType: 'staff_account',
      objectId: row.id,
      objectLabel: row.username,
      requestId: request.id,
    });
    return staffSessionFromRow(db, row);
  });

  app.post('/auth/logout', async (request, reply) => logout(request, reply, 'staff'));

  // `me` tetap terbuka saat kata sandi sementara supaya browser tahu harus ke halaman ganti sandi.
  app.get(
    '/auth/me',
    async (request) => (await authenticateStaff(request, { allowPendingPassword: true })).session,
  );

  app.patch('/auth/profile', async (request) =>
    updateOwnProfile(db, await authenticateStaff(request), request.body, request.id),
  );

  app.post('/auth/password', { config: PASSWORD_CHANGE_RATE }, async (request, reply) => {
    const principal = await authenticateStaff(request, { allowPendingPassword: true });
    return handlePasswordChange(request, reply, 'staff', 'staff', principal.actor);
  });

  // Reset mandiri berlaku untuk semua akun Portal, termasuk Admin Web (satu tabel akun).
  app.post('/auth/password-reset/request', { config: RESET_REQUEST_RATE }, async (request, reply) =>
    handleResetRequest(request, reply, 'staff', 'Portal Agrabudi'),
  );
  app.post('/auth/password-reset/confirm', { config: RESET_CONFIRM_RATE }, async (request, reply) =>
    handleResetConfirm(request, reply, 'staff'),
  );
};
