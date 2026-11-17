import {
  canManageAdminGroup,
  orderStatusChangeSchema,
  rowInputSchema,
  type ModuleDataset,
  type StaffSession,
} from '@agrabudi/contracts';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticateStaff } from '../auth/principals';
import { changeOrderStatus } from '../domain/orders';
import { audit } from '../lib/audit';
import { forbidden, notFound } from '../lib/errors';
import { envelope, parse } from '../lib/http';
import { CellReader } from '../portal/cells';
import { adminGroupOf, findPortalModule } from '../portal/registry';
import type { ModuleCtx, PortalModule } from '../portal/types';

const pathQuery = z.object({ path: z.string().regex(/^\/[a-z0-9/-]{1,160}$/) });
const idParams = z.object({ id: z.string().min(1).max(64) });

/** Modul yang boleh dikelola sesi ini. Deny by default: hanya Admin dengan unit/izin yang cocok (PRD 2.5). */
function moduleFor(session: StaffSession, path: string): PortalModule {
  const module = findPortalModule(path);
  if (!module)
    throw notFound(
      'Modul ini belum tersambung ke server. Datanya menunggu kamus data yang disahkan.',
    );
  const group = adminGroupOf(path);
  if (!group || !canManageAdminGroup(session, group)) throw forbidden();
  return module;
}

/**
 * API modul Portal (/api/v1). Setiap permintaan memeriksa sesi dan izin di server; menu
 * yang disaring di browser hanya tampilan (PRD 4.13).
 */
export const portalRoutes: FastifyPluginAsync = async (app) => {
  const { db, storage } = app.deps;

  app.get('/modules', async (request) => {
    const principal = await authenticateStaff(request);
    const { path } = parse(pathQuery, request.query);
    const module = moduleFor(principal.session, path);
    const ctx: ModuleCtx = { db, actor: principal.actor, requestId: request.id };
    const [columns, rows] = await Promise.all([module.columns(ctx), module.list(ctx)]);
    const dataset: ModuleDataset = {
      description: module.description,
      columns,
      rows,
      stats: module.stats ? module.stats(rows) : [],
      chart: null,
      filters: module.filters,
      editable: true,
      canCreate: module.canCreate,
      canDelete: module.canDelete && module.remove !== undefined,
      ownerCreate: false,
      upload: null,
      people: [],
    };
    return envelope(dataset);
  });

  app.post('/modules/rows', async (request, reply) => {
    const principal = await authenticateStaff(request);
    const { path } = parse(pathQuery, request.query);
    const module = moduleFor(principal.session, path);
    const input = parse(rowInputSchema, request.body);
    if (!input.id && !module.canCreate)
      throw forbidden('Data di menu ini tidak bisa ditambah dari Portal.');
    const ctx: ModuleCtx = { db, actor: principal.actor, requestId: request.id };
    const id = await module.save(ctx, input.id, new CellReader(input.cells));
    await audit(db, {
      actor: principal.actor,
      action: input.id ? 'module.update' : 'module.create',
      objectType: path,
      objectId: id,
      objectLabel: path,
      requestId: request.id,
    });
    return reply.code(input.id ? 200 : 201).send({ id });
  });

  app.delete('/modules/rows/:id', async (request, reply) => {
    const principal = await authenticateStaff(request);
    const { path } = parse(pathQuery, request.query);
    const { id } = parse(idParams, request.params);
    const module = moduleFor(principal.session, path);
    if (!module.canDelete || !module.remove)
      throw forbidden('Data di menu ini tidak bisa dihapus.');
    await module.remove({ db, actor: principal.actor, requestId: request.id }, id);
    await audit(db, {
      actor: principal.actor,
      action: 'module.delete',
      objectType: path,
      objectId: id,
      objectLabel: path,
      requestId: request.id,
    });
    return reply.code(204).send();
  });

  /** Unggah CSV belum punya kamus data dan aturan validasi yang disahkan (PRD US-12). */
  app.post('/modules/import', async (request) => {
    await authenticateStaff(request);
    throw notFound('Unggah data untuk menu ini belum tersedia di server.');
  });

  app.patch('/admin/outlet-orders/:id/status', async (request) => {
    const principal = await authenticateStaff(request);
    if (!canManageAdminGroup(principal.session, 'abkshop-outlet')) throw forbidden();
    const { id } = parse(idParams, request.params);
    const { status, reason } = parse(orderStatusChangeSchema, request.body);
    return changeOrderStatus(db, principal.actor, id, status, reason, request.id);
  });

  /** CV pelamar: hanya Admin dengan izin rekrutmen. Diunduh sebagai lampiran, tidak pernah lewat URL publik. */
  app.get('/admin/applications/:id/cv', async (request, reply) => {
    const principal = await authenticateStaff(request);
    if (!canManageAdminGroup(principal.session, 'kelola-karir')) throw forbidden();
    const { id } = parse(idParams, request.params);
    const submission = await db
      .selectFrom('formSubmissions')
      .select(['id', 'reference', 'cvFileKey', 'cvFileName', 'cvMime'])
      .where('id', '=', id)
      .where('kind', '=', 'job_application')
      .executeTakeFirst();
    if (!submission?.cvFileKey) throw notFound('CV tidak ditemukan.');
    const file = await storage.open('private', submission.cvFileKey);
    if (!file) throw notFound('Berkas CV tidak ditemukan di penyimpanan.');
    await audit(db, {
      actor: principal.actor,
      action: 'application.cv.download',
      objectType: 'form_submission',
      objectId: submission.id,
      objectLabel: submission.reference,
      requestId: request.id,
    });
    const extension = submission.cvFileKey.split('.').pop() ?? 'bin';
    return reply
      .header('content-type', submission.cvMime ?? 'application/octet-stream')
      .header('content-length', String(file.size))
      .header(
        'content-disposition',
        `attachment; filename="CV-${submission.reference}.${extension}"`,
      )
      .header('cache-control', 'private, no-store')
      .send(file.stream);
  });
};
