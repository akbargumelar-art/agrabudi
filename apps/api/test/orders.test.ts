import type { OutletOrder, OutletQuote } from '@agrabudi/contracts';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { newId } from '../src/lib/ids';
import {
  ORIGIN,
  createOutlet,
  createStaff,
  createTestContext,
  idemKey,
  loginOutlet,
  loginStaff,
  resetDatabase,
  type TestContext,
} from './helpers';

let ctx: TestContext;
let outletA: string;
let outletB: string;
const pkg = { a: newId(), b: newId(), c: newId(), draft: newId() };

beforeAll(async () => {
  ctx = await createTestContext();
});
afterAll(async () => ctx.close());

beforeEach(async () => {
  await resetDatabase(ctx.db);
  const category = newId();
  await ctx.db
    .insertInto('outletCategories')
    .values({ id: category, name: 'Perdana', sortOrder: 1 })
    .execute();
  const base = {
    categoryId: category,
    description: '',
    thumbnailUrl: null,
    maxQty: null,
    minQty: 1,
    multipleOf: 1,
    status: 'published' as const,
  };
  // Fixture pengujian US-05: 2 x Rp420.000 + 1 x Rp725.000 = Rp1.565.000. Bukan harga resmi.
  await ctx.db
    .insertInto('outletPackages')
    .values([
      { ...base, id: pkg.a, name: 'Paket Uji A', contents: '10 perdana', unitPriceRupiah: 420_000 },
      { ...base, id: pkg.b, name: 'Paket Uji B', contents: '20 voucher', unitPriceRupiah: 725_000 },
      {
        ...base,
        id: pkg.c,
        name: 'Paket Uji C',
        contents: '2 modem',
        unitPriceRupiah: 100_000,
        minQty: 2,
        multipleOf: 2,
        maxQty: 10,
      },
      {
        ...base,
        id: pkg.draft,
        name: 'Paket Draft',
        contents: '-',
        unitPriceRupiah: 1,
        status: 'draft',
      },
    ])
    .execute();
  await createOutlet(ctx.db, 'OUTLETA');
  await createOutlet(ctx.db, 'OUTLETB');
  outletA = await loginOutlet(ctx.app, 'OUTLETA');
  outletB = await loginOutlet(ctx.app, 'OUTLETB');
});

const quote = (cookie: string, items: unknown) =>
  ctx.app.inject({
    method: 'POST',
    url: '/api/v1/outlet/quotes',
    headers: { cookie, origin: ORIGIN.outlet },
    payload: { items },
  });

const order = (cookie: string, quoteId: string, key: string) =>
  ctx.app.inject({
    method: 'POST',
    url: '/api/v1/outlet/orders',
    headers: { cookie, origin: ORIGIN.outlet, 'idempotency-key': key },
    payload: { quoteId },
  });

async function validQuote(cookie = outletA): Promise<OutletQuote> {
  const response = await quote(cookie, [
    { packageId: pkg.a, qty: 2 },
    { packageId: pkg.b, qty: 1 },
  ]);
  expect(response.statusCode).toBe(201);
  return response.json();
}

describe('katalog dan quote', () => {
  it('katalog hanya untuk mitra yang masuk dan tidak memuat paket draft', async () => {
    expect(
      (await ctx.app.inject({ method: 'GET', url: '/api/v1/outlet/catalog' })).statusCode,
    ).toBe(401);
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/outlet/catalog',
      headers: { cookie: outletA },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.meta.source).toBe('api');
    expect(body.data.packages.map((item: { id: string }) => item.id)).not.toContain(pkg.draft);
    expect(body.data.packages.every((item: { channel: string }) => item.channel === 'outlet')).toBe(
      true,
    );
  });

  it('server menghitung total dari katalog: 2 x 420.000 + 1 x 725.000 = 1.565.000', async () => {
    const response = await quote(outletA, [
      { packageId: pkg.a, qty: 2, unitPriceRupiah: 1 },
      { packageId: pkg.b, qty: 1, unitPriceRupiah: 1 },
    ]);
    expect(response.statusCode).toBe(201);
    const body: OutletQuote = response.json();
    expect(body.totalRupiah).toBe(1_565_000);
    expect(body.items.map((item) => [item.unitPriceRupiah, item.lineTotalRupiah])).toEqual([
      [420_000, 840_000],
      [725_000, 725_000],
    ]);
    expect(Date.parse(body.expiresAt) - Date.parse(body.createdAt)).toBe(15 * 60_000);
  });

  it.each([
    ['nol', 0],
    ['negatif', -1],
    ['desimal', 1.5],
    ['teks', '2'],
  ])('jumlah %s ditolak', async (_label, qty) => {
    const response = await quote(outletA, [{ packageId: pkg.a, qty }]);
    expect(response.statusCode).toBe(422);
  });

  it('aturan minimum, maksimum, dan kelipatan dari paket diterapkan server', async () => {
    for (const qty of [1, 3, 12]) {
      const response = await quote(outletA, [{ packageId: pkg.c, qty }]);
      expect(response.statusCode).toBe(422);
      expect(response.json().error.fields['items.0.qty']).toMatch(/Paket Uji C/);
    }
    expect((await quote(outletA, [{ packageId: pkg.c, qty: 4 }])).statusCode).toBe(201);
  });

  it('paket draft, paket tak dikenal, dan paket ganda ditolak', async () => {
    expect((await quote(outletA, [{ packageId: pkg.draft, qty: 1 }])).statusCode).toBe(422);
    expect((await quote(outletA, [{ packageId: newId(), qty: 1 }])).statusCode).toBe(422);
    const duplicate = await quote(outletA, [
      { packageId: pkg.a, qty: 1 },
      { packageId: pkg.a, qty: 1 },
    ]);
    expect(duplicate.statusCode).toBe(422);
  });

  it('pilihan kosong ditolak', async () => {
    expect((await quote(outletA, [])).statusCode).toBe(422);
  });
});

describe('order dari quote', () => {
  it('order baru berstatus Diajukan, belum ditagih, dengan snapshot harga dan isi paket', async () => {
    const q = await validQuote();
    const response = await order(outletA, q.id, idemKey());
    expect(response.statusCode).toBe(201);
    const body: OutletOrder = response.json();
    expect(body).toMatchObject({
      status: 'diajukan',
      paymentStatus: 'belum_ditagih',
      totalRupiah: 1_565_000,
    });
    expect(body.number).toMatch(/^ORD-\d{6}-[2-9A-HJ-NP-Z]{6}$/);

    // Katalog diedit setelah order: histori order tidak berubah.
    await ctx.db
      .updateTable('outletPackages')
      .set({ name: 'Nama Baru', unitPriceRupiah: 999_000, priceVersion: 2 })
      .where('id', '=', pkg.a)
      .execute();
    const read = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/outlet/orders/${body.id}`,
      headers: { cookie: outletA },
    });
    expect(read.json().data.items[0]).toMatchObject({
      nameSnapshot: 'Paket Uji A',
      unitPriceRupiah: 420_000,
      qty: 2,
      lineTotalRupiah: 840_000,
    });
  });

  it('Idempotency-Key yang sama mengembalikan order yang sama, bukan order kedua', async () => {
    const q = await validQuote();
    const key = idemKey();
    const first = await order(outletA, q.id, key);
    const second = await order(outletA, q.id, key);
    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(200);
    expect(second.headers['idempotent-replayed']).toBe('true');
    expect(second.json().id).toBe(first.json().id);
    const count = await ctx.db
      .selectFrom('outletOrders')
      .select(ctx.db.fn.countAll<number>().as('n'))
      .executeTakeFirstOrThrow();
    expect(Number(count.n)).toBe(1);
  });

  it('key yang sama untuk quote lain ditolak 409', async () => {
    const key = idemKey();
    expect((await order(outletA, (await validQuote()).id, key)).statusCode).toBe(201);
    const other = await order(outletA, (await validQuote()).id, key);
    expect(other.statusCode).toBe(409);
  });

  it('satu quote hanya menjadi satu order walau dikirim dengan key berbeda', async () => {
    const q = await validQuote();
    expect((await order(outletA, q.id, idemKey())).statusCode).toBe(201);
    expect((await order(outletA, q.id, idemKey())).statusCode).toBe(409);
  });

  it('kiriman bersamaan dengan key sama menghasilkan tepat satu order', async () => {
    const q = await validQuote();
    const key = idemKey();
    const responses = await Promise.all(Array.from({ length: 5 }, () => order(outletA, q.id, key)));
    const ids = new Set(responses.map((response) => response.json().id));
    expect(responses.every((response) => [200, 201].includes(response.statusCode))).toBe(true);
    expect(ids.size).toBe(1);
    expect(responses.filter((response) => response.statusCode === 201)).toHaveLength(1);
  });

  it('kiriman bersamaan dengan key berbeda untuk satu quote: satu berhasil, sisanya 409', async () => {
    const q = await validQuote();
    const responses = await Promise.all(
      Array.from({ length: 4 }, () => order(outletA, q.id, idemKey())),
    );
    expect(responses.filter((response) => response.statusCode === 201)).toHaveLength(1);
    expect(responses.filter((response) => response.statusCode === 409)).toHaveLength(3);
  });

  it('harga berubah setelah quote: order ditolak dan mitra diminta menyetujui quote baru', async () => {
    const q = await validQuote();
    await ctx.db
      .updateTable('outletPackages')
      .set({ unitPriceRupiah: 430_000, priceVersion: 2 })
      .where('id', '=', pkg.a)
      .execute();
    const response = await order(outletA, q.id, idemKey());
    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe('QUOTE_CHANGED');
  });

  it('paket diarsipkan setelah quote: order ditolak', async () => {
    const q = await validQuote();
    await ctx.db
      .updateTable('outletPackages')
      .set({ status: 'archived' })
      .where('id', '=', pkg.b)
      .execute();
    expect((await order(outletA, q.id, idemKey())).json().error.code).toBe('QUOTE_CHANGED');
  });

  it('quote kedaluwarsa ditolak', async () => {
    const q = await validQuote();
    await ctx.db
      .updateTable('outletQuotes')
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where('id', '=', q.id)
      .execute();
    const response = await order(outletA, q.id, idemKey());
    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe('QUOTE_EXPIRED');
  });

  it('order tanpa Idempotency-Key ditolak', async () => {
    const q = await validQuote();
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/outlet/orders',
      headers: { cookie: outletA, origin: ORIGIN.outlet },
      payload: { quoteId: q.id },
    });
    expect(response.statusCode).toBe(422);
  });
});

describe('batas antar outlet', () => {
  it('outlet B tidak bisa membaca order outlet A dengan mengganti ID', async () => {
    const created: OutletOrder = (await order(outletA, (await validQuote()).id, idemKey())).json();
    const read = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/outlet/orders/${created.id}`,
      headers: { cookie: outletB },
    });
    expect(read.statusCode).toBe(200);
    expect(read.json().data).toBeNull();
    const list = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/outlet/orders',
      headers: { cookie: outletB },
    });
    expect(list.json().data).toEqual([]);
  });

  it('outlet B tidak bisa memakai quote milik outlet A', async () => {
    const q = await validQuote(outletA);
    const response = await order(outletB, q.id, idemKey());
    expect(response.statusCode).toBe(404);
  });

  it('profil diambil dari sesi, bukan parameter', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/outlet/profile?digiposId=OUTLETA',
      headers: { cookie: outletB },
    });
    expect(response.json().data.digiposId).toBe('OUTLETB');
  });
});

describe('pemrosesan order oleh Admin', () => {
  async function submitted(): Promise<OutletOrder> {
    return (await order(outletA, (await validQuote()).id, idemKey())).json();
  }
  const changeStatus = (cookie: string, id: string, status: string, reason: string | null = null) =>
    ctx.app.inject({
      method: 'PATCH',
      url: `/api/v1/admin/outlet-orders/${id}/status`,
      headers: { cookie, origin: ORIGIN.portal },
      payload: { status, reason },
    });

  it('transisi sah tercatat dengan actor; transisi lompat ditolak', async () => {
    await createStaff(ctx.db, { username: 'adminmobile', role: 'admin', unit: 'mobile' });
    const admin = await loginStaff(ctx.app, 'adminmobile');
    const created = await submitted();

    expect((await changeStatus(admin, created.id, 'selesai')).json().error.code).toBe(
      'INVALID_TRANSITION',
    );
    const confirmed = await changeStatus(admin, created.id, 'dikonfirmasi');
    expect(confirmed.statusCode).toBe(200);
    expect(confirmed.json()).toMatchObject({
      status: 'dikonfirmasi',
      paymentStatus: 'belum_ditagih',
    });

    const events = await ctx.db
      .selectFrom('outletOrderEvents')
      .selectAll()
      .where('orderId', '=', created.id)
      .orderBy('id')
      .execute();
    expect(events.map((event) => [event.fromStatus, event.toStatus, event.actorRealm])).toEqual([
      [null, 'diajukan', 'outlet'],
      ['diajukan', 'dikonfirmasi', 'staff'],
    ]);
  });

  it('Ditolak dan Dibatalkan wajib beralasan; status final tidak bisa diubah lagi', async () => {
    await createStaff(ctx.db, { username: 'adminmobile', role: 'admin', unit: 'mobile' });
    const admin = await loginStaff(ctx.app, 'adminmobile');
    const created = await submitted();
    expect((await changeStatus(admin, created.id, 'ditolak')).statusCode).toBe(422);
    expect((await changeStatus(admin, created.id, 'ditolak', 'Stok paket habis')).statusCode).toBe(
      200,
    );
    expect((await changeStatus(admin, created.id, 'dikonfirmasi')).statusCode).toBe(409);
    const event = await ctx.db
      .selectFrom('outletOrderEvents')
      .select('reason')
      .where('toStatus', '=', 'ditolak')
      .executeTakeFirstOrThrow();
    expect(event.reason).toBe('Stok paket habis');
  });

  it('hanya Admin unit pengelola ABKShop Outlet yang boleh memproses', async () => {
    const created = await submitted();
    await createStaff(ctx.db, { username: 'adminhousehold', role: 'admin', unit: 'household' });
    await createStaff(ctx.db, {
      username: 'sfmobile',
      role: 'salesforce',
      unit: 'mobile',
      scope: 'self',
    });
    await createStaff(ctx.db, { username: 'manager', role: 'manager' });
    for (const username of ['adminhousehold', 'sfmobile', 'manager']) {
      const cookie = await loginStaff(ctx.app, username);
      expect((await changeStatus(cookie, created.id, 'dikonfirmasi')).statusCode).toBe(403);
    }
    // Outlet pun tidak bisa memakai endpoint Admin.
    expect((await changeStatus(outletA, created.id, 'dikonfirmasi')).statusCode).toBe(401);
  });
});
