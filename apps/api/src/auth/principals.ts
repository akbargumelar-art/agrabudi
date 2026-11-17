import type { OutletSession, StaffPermission, StaffSession } from '@agrabudi/contracts';
import type { FastifyRequest } from 'fastify';
import type { Kysely } from 'kysely';
import type { Database, OutletAccountRow, StaffAccountRow } from '../db/types';
import type { Actor } from '../lib/audit';
import { unauthenticated } from '../lib/errors';
import { readSessionCookie, resolveSession } from './sessions';

/** Siapa yang sedang memanggil API, setelah sesi diverifikasi server. */
export type StaffPrincipal = { session: StaffSession; token: string; actor: Actor };
export type OutletPrincipal = {
  session: OutletSession;
  accountId: string;
  token: string;
  actor: Actor;
};

export async function staffSessionFromRow(
  db: Kysely<Database>,
  row: StaffAccountRow,
): Promise<StaffSession> {
  const permissions = await db
    .selectFrom('staffPermissions')
    .select('permission')
    .where('accountId', '=', row.id)
    .execute();
  return {
    accountId: row.id,
    username: row.username,
    displayName: row.displayName,
    email: row.email,
    phone: row.phone,
    role: row.role,
    unit: row.unit,
    scope: row.scope,
    permissions: permissions.map((item) => item.permission as StaffPermission).sort(),
  };
}

export function outletSessionFromRow(row: OutletAccountRow): OutletSession {
  return {
    digiposId: row.digiposId,
    outletName: row.outletName,
    ownerName: row.ownerName,
    tap: row.tap,
  };
}

async function activeStaff(db: Kysely<Database>, id: string) {
  return db
    .selectFrom('staffAccounts')
    .selectAll()
    .where('id', '=', id)
    .where('status', '=', 'active')
    .executeTakeFirst();
}

/**
 * Sesi Portal operasional. Hanya cookie realm `staff`; akun Admin Web tidak pernah
 * mendapat sesi realm ini, dan diperiksa lagi di sini (deny by default).
 */
export async function authenticateStaff(request: FastifyRequest): Promise<StaffPrincipal> {
  const { db, config } = request.server.deps;
  const token = readSessionCookie(request, 'staff', config.COOKIE_SECURE);
  if (!token) throw unauthenticated();
  const accountId = await resolveSession(db, 'staff', token);
  if (!accountId) throw unauthenticated();
  const row = await activeStaff(db, accountId);
  if (!row || row.role === 'web_admin') throw unauthenticated();
  const session = await staffSessionFromRow(db, row);
  return { session, token, actor: { realm: 'staff', id: row.id, label: row.username } };
}

/** Sesi console website. Hanya cookie realm `web_admin`; cookie staff diabaikan (PRD 4.3). */
export async function authenticateWebAdmin(request: FastifyRequest): Promise<StaffPrincipal> {
  const { db, config } = request.server.deps;
  const token = readSessionCookie(request, 'web_admin', config.COOKIE_SECURE);
  if (!token) throw unauthenticated();
  const accountId = await resolveSession(db, 'web_admin', token);
  if (!accountId) throw unauthenticated();
  const row = await activeStaff(db, accountId);
  if (!row || row.role !== 'web_admin') throw unauthenticated();
  const session = await staffSessionFromRow(db, row);
  return { session, token, actor: { realm: 'web_admin', id: row.id, label: row.username } };
}

export async function authenticateOutlet(request: FastifyRequest): Promise<OutletPrincipal> {
  const { db, config } = request.server.deps;
  const token = readSessionCookie(request, 'outlet', config.COOKIE_SECURE);
  if (!token) throw unauthenticated();
  const accountId = await resolveSession(db, 'outlet', token);
  if (!accountId) throw unauthenticated();
  const row = await db
    .selectFrom('outletAccounts')
    .selectAll()
    .where('id', '=', accountId)
    .where('status', '=', 'active')
    .executeTakeFirst();
  if (!row) throw unauthenticated();
  return {
    session: outletSessionFromRow(row),
    accountId: row.id,
    token,
    actor: { realm: 'outlet', id: row.id, label: row.digiposId },
  };
}
