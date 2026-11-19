import {
  MANAGED_UNITS,
  OUTLET_MANAGER_UNIT,
  SCOPE_BY_ROLE,
  canManageAdminGroup,
  createOutletAccountSchema,
  createStaffAccountSchema,
  manageableStaffRoleSchema,
  updateOutletAccountSchema,
  updateStaffAccountSchema,
  type CredentialIssueResult,
  type ManagedOutletAccount,
  type ManagedStaffAccount,
  type StaffPermission,
} from '@agrabudi/contracts';
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { authenticateStaff, type StaffPrincipal } from '../auth/principals';
import { isDuplicateKey, type Db } from '../db/database';
import type { OutletAccountRow, StaffAccountRow } from '../db/types';
import {
  issueTemporaryPassword,
  revokeAllSessions,
  temporaryPasswordMessage,
} from '../domain/credentials';
import { audit } from '../lib/audit';
import { conflict, forbidden, invalid, notFound } from '../lib/errors';
import { envelope, parse } from '../lib/http';
import { newId } from '../lib/ids';

const idParams = z.object({ id: z.uuid() });
const ISSUE_RATE = { rateLimit: { max: 20, timeWindow: '10 minutes' } };

/**
 * User Management Portal (/api/v1/admin/accounts). Hanya Admin dengan izin `user.manage`.
 * Admin mengelola akun di unit yang menjadi tanggung jawabnya; akun Outlet hanya oleh Admin
 * Mobile (baseline usulan D-B4). Manager dan Admin Web tidak dibuat dari sini (CLI server).
 * Kata sandi tidak pernah diketik admin: server membuat kata sandi sementara acak dan
 * mengirimnya ke WhatsApp pemilik akun.
 */
async function manager(request: FastifyRequest): Promise<StaffPrincipal & { unit: NonNullable<StaffPrincipal['session']['unit']> }> {
  const principal = await authenticateStaff(request);
  const { session } = principal;
  if (!canManageAdminGroup(session, 'user-management') || session.unit === null) throw forbidden();
  return { ...principal, unit: session.unit };
}

function staffInScope(row: StaffAccountRow, unit: NonNullable<StaffAccountRow['unit']>): boolean {
  return (
    manageableStaffRoleSchema.safeParse(row.role).success &&
    row.unit !== null &&
    MANAGED_UNITS[unit].includes(row.unit)
  );
}

async function managedStaff(db: Db, id: string, unit: NonNullable<StaffAccountRow['unit']>) {
  const row = await db.selectFrom('staffAccounts').selectAll().where('id', '=', id).executeTakeFirst();
  // Akun di luar cakupan dijawab sama dengan akun yang tidak ada.
  if (!row || !staffInScope(row, unit)) throw notFound('Akun tidak ditemukan.');
  return row;
}

async function toStaffAccounts(
  db: Db,
  rows: StaffAccountRow[],
  selfId: string,
): Promise<ManagedStaffAccount[]> {
  const ids = rows.map((row) => row.id);
  const grants =
    ids.length === 0
      ? []
      : await db
          .selectFrom('staffPermissions')
          .select(['accountId', 'permission'])
          .where('accountId', 'in', ids)
          .execute();
  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    phone: row.phone,
    role: row.role,
    unit: row.unit,
    scope: row.scope,
    permissions: grants
      .filter((grant) => grant.accountId === row.id)
      .map((grant) => grant.permission as StaffPermission)
      .sort(),
    status: row.status,
    mustChangePassword: row.mustChangePassword,
    isSelf: row.id === selfId,
  }));
}

function toOutletAccount(row: OutletAccountRow): ManagedOutletAccount {
  return {
    id: row.id,
    digiposId: row.digiposId,
    outletName: row.outletName,
    ownerName: row.ownerName,
    tap: row.tap,
    phone: row.phone,
    registeredAt: row.registeredAt,
    status: row.status,
    mustChangePassword: row.mustChangePassword,
  };
}

function requireOutletManager(unit: string) {
  if (unit !== OUTLET_MANAGER_UNIT) throw forbidden('Akun Outlet dikelola Admin Mobile.');
}

export const accountRoutes: FastifyPluginAsync = async (app) => {
  const { db, config } = app.deps;
  const portalUrl = config.APP_URL_PORTAL;
  const outletUrl = config.APP_URL_OUTLET;

  // ------------------------------------------------------------ akun Portal
  app.get('/admin/accounts/staff', async (request) => {
    const principal = await manager(request);
    const rows = await db
      .selectFrom('staffAccounts')
      .selectAll()
      .where('role', 'in', manageableStaffRoleSchema.options)
      .where('unit', 'in', [...MANAGED_UNITS[principal.unit]])
      .orderBy('displayName')
      .execute();
    return envelope(await toStaffAccounts(db, rows, principal.session.accountId));
  });

  app.post('/admin/accounts/staff', { config: ISSUE_RATE }, async (request, reply) => {
    const principal = await manager(request);
    const input = parse(createStaffAccountSchema, request.body);
    if (!MANAGED_UNITS[principal.unit].includes(input.unit)) {
      throw forbidden('Unit ini di luar cakupan pengelolaan Anda.');
    }
    // Izin tambahan hanya boleh diberikan bila pemberi juga memilikinya (tidak ada eskalasi).
    const missing = input.permissions.filter((item) => !principal.session.permissions.includes(item));
    if (missing.length > 0) throw forbidden('Anda tidak bisa memberi izin yang tidak Anda miliki.');
    const id = newId();
    try {
      const delivery = await issueTemporaryPassword(
        db,
        app.deps.wa,
        input.phone,
        temporaryPasswordMessage('Portal Agrabudi', input.username, portalUrl, 'created'),
        async (trx, passwordHash) => {
          await trx
            .insertInto('staffAccounts')
            .values({
              id,
              username: input.username,
              displayName: input.displayName,
              email: null,
              phone: input.phone,
              role: input.role,
              unit: input.unit,
              scope: SCOPE_BY_ROLE[input.role],
              passwordHash,
              mustChangePassword: true,
            })
            .execute();
          if (input.permissions.length > 0) {
            await trx
              .insertInto('staffPermissions')
              .values(input.permissions.map((permission) => ({ accountId: id, permission })))
              .execute();
          }
          await audit(trx, {
            actor: principal.actor,
            action: 'account.create',
            objectType: 'staff_account',
            objectId: id,
            objectLabel: input.username,
            requestId: request.id,
          });
        },
      );
      const result: CredentialIssueResult = { id, delivery };
      return reply.code(201).send(result);
    } catch (error) {
      if (isDuplicateKey(error)) {
        throw invalid('Username sudah dipakai.', { username: 'Username sudah dipakai.' });
      }
      throw error;
    }
  });

  app.patch('/admin/accounts/staff/:id', async (request) => {
    const principal = await manager(request);
    const { id } = parse(idParams, request.params);
    const input = parse(updateStaffAccountSchema, request.body);
    const row = await managedStaff(db, id, principal.unit);
    if (row.id === principal.session.accountId && input.status !== 'active') {
      throw conflict('Akun yang sedang Anda pakai tidak bisa dinonaktifkan.');
    }
    await db.transaction().execute(async (trx) => {
      await trx
        .updateTable('staffAccounts')
        .set({ displayName: input.displayName, phone: input.phone, status: input.status })
        .where('id', '=', id)
        .execute();
      if (input.status === 'disabled') await revokeAllSessions(trx, 'staff', id);
      await audit(trx, {
        actor: principal.actor,
        action: input.status === row.status ? 'account.update' : `account.${input.status}`,
        objectType: 'staff_account',
        objectId: id,
        objectLabel: row.username,
        requestId: request.id,
      });
    });
    return { id };
  });

  app.post('/admin/accounts/staff/:id/reset-password', { config: ISSUE_RATE }, async (request) => {
    const principal = await manager(request);
    const { id } = parse(idParams, request.params);
    const row = await managedStaff(db, id, principal.unit);
    if (row.id === principal.session.accountId) {
      throw conflict('Ganti kata sandi Anda sendiri lewat halaman Akun.');
    }
    if (row.status !== 'active') throw conflict('Aktifkan akun dulu sebelum mereset kata sandi.');
    if (!row.phone) {
      throw invalid('Akun ini belum punya nomor WhatsApp. Isi nomor HP dulu.', {
        phone: 'Nomor HP wajib untuk reset.',
      });
    }
    const delivery = await issueTemporaryPassword(
      db,
      app.deps.wa,
      row.phone,
      temporaryPasswordMessage('Portal Agrabudi', row.username, portalUrl, 'reset'),
      async (trx, passwordHash) => {
        await trx
          .updateTable('staffAccounts')
          .set({ passwordHash, mustChangePassword: true, passwordChangedAt: null })
          .where('id', '=', id)
          .execute();
        await revokeAllSessions(trx, 'staff', id);
        await audit(trx, {
          actor: principal.actor,
          action: 'account.password.reset_admin',
          objectType: 'staff_account',
          objectId: id,
          objectLabel: row.username,
          requestId: request.id,
        });
      },
    );
    const result: CredentialIssueResult = { id, delivery };
    return result;
  });


  // ------------------------------------------------------------ akun Outlet
  app.get('/admin/accounts/outlets', async (request) => {
    const principal = await manager(request);
    requireOutletManager(principal.unit);
    const rows = await db.selectFrom('outletAccounts').selectAll().orderBy('outletName').execute();
    return envelope(rows.map(toOutletAccount));
  });

  app.post('/admin/accounts/outlets', { config: ISSUE_RATE }, async (request, reply) => {
    const principal = await manager(request);
    requireOutletManager(principal.unit);
    const input = parse(createOutletAccountSchema, request.body);
    const id = newId();
    try {
      const delivery = await issueTemporaryPassword(
        db,
        app.deps.wa,
        input.phone,
        temporaryPasswordMessage('Agrabudi Outlet', input.digiposId, outletUrl, 'created'),
        async (trx, passwordHash) => {
          await trx
            .insertInto('outletAccounts')
            .values({
              id,
              digiposId: input.digiposId,
              outletName: input.outletName,
              ownerName: input.ownerName,
              tap: input.tap || null,
              phone: input.phone,
              registeredAt: input.registeredAt,
              salesforceName: null,
              photoUrl: null,
              passwordHash,
              mustChangePassword: true,
            })
            .execute();
          await audit(trx, {
            actor: principal.actor,
            action: 'account.create',
            objectType: 'outlet_account',
            objectId: id,
            objectLabel: input.digiposId,
            requestId: request.id,
          });
        },
      );
      const result: CredentialIssueResult = { id, delivery };
      return reply.code(201).send(result);
    } catch (error) {
      if (isDuplicateKey(error)) {
        throw invalid('ID Digipos sudah terdaftar.', { digiposId: 'ID Digipos sudah terdaftar.' });
      }
      throw error;
    }
  });

  async function managedOutlet(request: FastifyRequest) {
    const principal = await manager(request);
    requireOutletManager(principal.unit);
    const { id } = parse(idParams, request.params);
    const row = await db
      .selectFrom('outletAccounts')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    if (!row) throw notFound('Akun outlet tidak ditemukan.');
    return { principal, row };
  }

  app.patch('/admin/accounts/outlets/:id', async (request) => {
    const { principal, row } = await managedOutlet(request);
    const input = parse(updateOutletAccountSchema, request.body);
    await db.transaction().execute(async (trx) => {
      await trx
        .updateTable('outletAccounts')
        .set({
          outletName: input.outletName,
          ownerName: input.ownerName,
          tap: input.tap || null,
          phone: input.phone,
          status: input.status,
        })
        .where('id', '=', row.id)
        .execute();
      if (input.status === 'disabled') await revokeAllSessions(trx, 'outlet', row.id);
      await audit(trx, {
        actor: principal.actor,
        action: input.status === row.status ? 'account.update' : `account.${input.status}`,
        objectType: 'outlet_account',
        objectId: row.id,
        objectLabel: row.digiposId,
        requestId: request.id,
      });
    });
    return { id: row.id };
  });

  app.post('/admin/accounts/outlets/:id/reset-password', { config: ISSUE_RATE }, async (request) => {
    const { principal, row } = await managedOutlet(request);
    if (row.status !== 'active') throw conflict('Aktifkan akun dulu sebelum mereset kata sandi.');
    if (!row.phone) {
      throw invalid('Outlet ini belum punya nomor WhatsApp. Isi nomor HP dulu.', {
        phone: 'Nomor HP wajib untuk reset.',
      });
    }
    const delivery = await issueTemporaryPassword(
      db,
      app.deps.wa,
      row.phone,
      temporaryPasswordMessage('Agrabudi Outlet', row.digiposId, outletUrl, 'reset'),
      async (trx, passwordHash) => {
        await trx
          .updateTable('outletAccounts')
          .set({ passwordHash, mustChangePassword: true, passwordChangedAt: null })
          .where('id', '=', row.id)
          .execute();
        await revokeAllSessions(trx, 'outlet', row.id);
        await audit(trx, {
          actor: principal.actor,
          action: 'account.password.reset_admin',
          objectType: 'outlet_account',
          objectId: row.id,
          objectLabel: row.digiposId,
          requestId: request.id,
        });
      },
    );
    const result: CredentialIssueResult = { id: row.id, delivery };
    return result;
  });
};

