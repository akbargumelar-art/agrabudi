import {
  IDEMPOTENCY_HEADER,
  createOutletOrderSchema,
  idempotencyKeySchema,
  outletLoginSchema,
  outletQuoteRequestSchema,
  type OutletProfile,
} from '@agrabudi/contracts';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticateOutlet, outletSessionFromRow } from '../auth/principals';
import {
  createSession,
  readSessionCookie,
  revokeSession,
  setSessionCookie,
} from '../auth/sessions';
import {
  getDocument,
  getOutletCatalog,
  getProgram,
  listCuanProducts,
  listPrograms,
  listRewardHandovers,
} from '../domain/content';
import { createOrder, createQuote, getOwnOrder, listOwnOrders } from '../domain/orders';
import { audit } from '../lib/audit';
import { HttpError } from '../lib/errors';
import { envelope, parse } from '../lib/http';
import { dummyPasswordHash, verifyPassword } from '../lib/password';
import { LOGIN_RATE, logout } from './staff-auth';

const slugParams = z.object({ slug: z.string().min(1).max(120) });
const idParams = z.object({ id: z.uuid() });
const ORDER_RATE = { rateLimit: { max: 30, timeWindow: '1 minute' } };

/**
 * API aplikasi Outlet (/api/v1/outlet). Outlet yang dilayani selalu diambil dari sesi,
 * tidak pernah dari ID kiriman browser (PRD 4.6). Program, dokumentasi hadiah, dan
 * Kalkulator Cuan terbuka tanpa login, sama seperti halaman Outlet sekarang.
 */
export const outletRoutes: FastifyPluginAsync = async (app) => {
  const { db, config } = app.deps;

  app.post('/auth/login', { config: LOGIN_RATE }, async (request, reply) => {
    const { digiposId, password } = parse(outletLoginSchema, request.body);
    const row = await db
      .selectFrom('outletAccounts')
      .selectAll()
      .where('digiposId', '=', digiposId)
      .executeTakeFirst();
    const valid = await verifyPassword(password, row?.passwordHash ?? (await dummyPasswordHash()));
    if (!row || !valid || row.status !== 'active') {
      request.log.info({ event: 'login_failed', realm: 'outlet' }, 'login gagal');
      throw new HttpError(401, 'UNAUTHENTICATED', 'ID Digipos atau kata sandi salah.');
    }
    const old = readSessionCookie(request, 'outlet', config.COOKIE_SECURE);
    if (old) await revokeSession(db, old);
    const { token, maxAgeSeconds } = await createSession(db, 'outlet', row.id);
    setSessionCookie(reply, 'outlet', config.COOKIE_SECURE, token, maxAgeSeconds);
    await audit(db, {
      actor: { realm: 'outlet', id: row.id, label: row.digiposId },
      action: 'auth.login',
      objectType: 'outlet_account',
      objectId: row.id,
      objectLabel: row.digiposId,
      requestId: request.id,
    });
    return outletSessionFromRow(row);
  });

  app.post('/auth/logout', async (request, reply) => logout(request, reply, 'outlet'));
  app.get('/auth/me', async (request) => (await authenticateOutlet(request)).session);

  app.get('/catalog', async (request) => {
    await authenticateOutlet(request);
    return envelope(await getOutletCatalog(db));
  });

  app.post('/quotes', { config: ORDER_RATE }, async (request, reply) => {
    const principal = await authenticateOutlet(request);
    const body = parse(outletQuoteRequestSchema, request.body);
    const quote = await createQuote(db, principal.accountId, body, config.QUOTE_TTL_MINUTES);
    return reply.code(201).send(quote);
  });

  app.post('/orders', { config: ORDER_RATE }, async (request, reply) => {
    const principal = await authenticateOutlet(request);
    const rawKey = request.headers[IDEMPOTENCY_HEADER];
    const key = parse(idempotencyKeySchema, typeof rawKey === 'string' ? rawKey : '');
    const { quoteId } = parse(createOutletOrderSchema, request.body);
    const result = await createOrder(
      db,
      principal.actor,
      principal.accountId,
      quoteId,
      key,
      request.id,
    );
    if (result.replayed) reply.header('idempotent-replayed', 'true');
    return reply.code(result.replayed ? 200 : 201).send(result.order);
  });

  app.get('/orders', async (request) => {
    const principal = await authenticateOutlet(request);
    return envelope(await listOwnOrders(db, principal.accountId));
  });

  app.get('/orders/:id', async (request) => {
    const principal = await authenticateOutlet(request);
    const parsed = idParams.safeParse(request.params);
    // ID yang bentuknya salah diperlakukan sama dengan order yang tidak ada.
    if (!parsed.success) return envelope(null);
    return envelope(await getOwnOrder(db, principal.accountId, parsed.data.id));
  });

  app.get('/profile', async (request) => {
    const principal = await authenticateOutlet(request);
    const row = await db
      .selectFrom('outletAccounts')
      .selectAll()
      .where('id', '=', principal.accountId)
      .executeTakeFirstOrThrow();
    const programs = await db
      .selectFrom('outletProgramProgress')
      .select(['programTitle', 'progress', 'status'])
      .where('outletAccountId', '=', row.id)
      .orderBy('id', 'desc')
      .execute();
    const profile: OutletProfile = {
      ...outletSessionFromRow(row),
      phone: row.phone,
      address: row.address,
      district: row.district,
      salesforceName: row.salesforceName,
      registeredAt: row.registeredAt,
      photoUrl: row.photoUrl,
      programs,
    };
    return envelope(profile);
  });

  app.get('/programs', async () => envelope(await listPrograms(db, 'outlet')));
  app.get('/programs/:slug', async (request) => {
    const { slug } = parse(slugParams, request.params);
    return envelope(await getProgram(db, 'outlet', slug));
  });
  app.get('/reward-handovers', async () => envelope(await listRewardHandovers(db)));
  app.get('/cuan-products', async () => envelope(await listCuanProducts(db)));
  app.get('/cuan-contact', async () => envelope(await getDocument(db, 'cuan_contact')));
};
