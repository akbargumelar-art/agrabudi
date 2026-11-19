import {
  passwordChangeSchema,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
} from '@agrabudi/contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { createSession, setSessionCookie } from '../auth/sessions';
import {
  changeOwnPassword,
  confirmPasswordReset,
  requestPasswordReset,
} from '../domain/credentials';
import type { PasswordResetRealm, SessionRealm } from '../db/types';
import { audit, type Actor } from '../lib/audit';
import { HttpError } from '../lib/errors';
import { parse } from '../lib/http';

/** Minta kode: 5 kali per IP per 15 menit. Konfirmasi: 10 kali. Ditambah batas per akun di domain. */
export const RESET_REQUEST_RATE = { rateLimit: { max: 5, timeWindow: '15 minutes' } };
export const RESET_CONFIRM_RATE = { rateLimit: { max: 10, timeWindow: '15 minutes' } };
export const PASSWORD_CHANGE_RATE = { rateLimit: { max: 10, timeWindow: '15 minutes' } };

const resetUnavailable = () =>
  new HttpError(
    503,
    'SERVICE_UNAVAILABLE',
    'Reset kata sandi lewat WhatsApp belum aktif. Hubungi admin untuk reset kata sandi.',
  );

/**
 * Ganti kata sandi sendiri. Sesi lama di semua perangkat dicabut, lalu browser ini mendapat
 * sesi baru di realm yang sama supaya pengguna tidak perlu login ulang.
 */
export async function handlePasswordChange(
  request: FastifyRequest,
  reply: FastifyReply,
  accountRealm: PasswordResetRealm,
  sessionRealm: SessionRealm,
  actor: Actor,
) {
  const { db, config } = request.server.deps;
  const { currentPassword, newPassword } = parse(passwordChangeSchema, request.body);
  await changeOwnPassword(db, accountRealm, actor.id, currentPassword, newPassword);
  const { token, maxAgeSeconds } = await createSession(db, sessionRealm, actor.id);
  setSessionCookie(reply, sessionRealm, config.COOKIE_SECURE, token, maxAgeSeconds);
  await audit(db, {
    actor,
    action: 'auth.password.change',
    objectType: accountRealm === 'staff' ? 'staff_account' : 'outlet_account',
    objectId: actor.id,
    objectLabel: actor.label,
    requestId: request.id,
  });
  return reply.code(204).send();
}

/** Langkah 1: selalu 202 dengan pesan yang sama, ada atau tidak ada akunnya. */
export async function handleResetRequest(
  request: FastifyRequest,
  reply: FastifyReply,
  realm: PasswordResetRealm,
  appName: string,
) {
  const { db, wa } = request.server.deps;
  const { identifier } = parse(passwordResetRequestSchema, request.body);
  if (!wa) throw resetUnavailable();
  await requestPasswordReset(db, wa, request.log, realm, identifier, appName);
  return reply.code(202).send({
    message:
      'Bila akun terdaftar dan punya nomor WhatsApp, kode reset sudah dikirim ke nomor itu.',
  });
}

export async function handleResetConfirm(
  request: FastifyRequest,
  reply: FastifyReply,
  realm: PasswordResetRealm,
) {
  const { db } = request.server.deps;
  const { identifier, code, newPassword } = parse(passwordResetConfirmSchema, request.body);
  const accountId = await confirmPasswordReset(db, realm, identifier, code, newPassword);
  await audit(db, {
    actor: { realm: 'public', id: null, label: 'reset mandiri' },
    action: 'auth.password.reset_self',
    objectType: realm === 'staff' ? 'staff_account' : 'outlet_account',
    objectId: accountId,
    objectLabel: identifier.trim().slice(0, 64),
    requestId: request.id,
  });
  return reply.code(204).send();
}
