import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { newId } from '../src/lib/ids';
import {
  ORIGIN,
  SAMPLE_PDF,
  createOutlet,
  createStaff,
  createTestContext,
  fakeWa,
  idemKey,
  loginOutlet,
  loginStaff,
  multipart,
  resetDatabase,
  type FakeWa,
  type TestContext,
} from './helpers';

let ctx: TestContext;
let wa: FakeWa;
let webAdmin: string;

const ORDER_GROUP = '120363000000000001@g.us';
const CAREER_GROUP = '120363000000000002@g.us';
const DIGIPOS_GROUP = '120363000000000003@g.us';
const settings = {
  orderCustomer: true,
  orderGroup: ORDER_GROUP,
  careerGroup: CAREER_GROUP,
  digiposGroup: DIGIPOS_GROUP,
};

beforeAll(async () => {
  wa = fakeWa();
  ctx = await createTestContext({}, wa);
});
afterAll(async () => ctx.close());
beforeEach(async () => {
  await resetDatabase(ctx.db);
  wa.sent.length = 0;
  wa.fail = false;
  await createStaff(ctx.db, { username: 'adminweb', role: 'web_admin' });
  webAdmin = await loginStaff(ctx.app, 'adminweb');
});

const cms = (method: 'GET' | 'PUT' | 'POST', url: string, payload?: unknown) =>
  ctx.app.inject({
    method,
    url: `/web-admin/api/v1${url}`,
    headers: { cookie: webAdmin, ...(method === 'GET' ? {} : { origin: ORIGIN.portal }) },
    ...(payload === undefined ? {} : { payload: payload as Record<string, unknown> }),
  });

const settle = () => new Promise((resolve) => setTimeout(resolve, 100));

describe('pengaturan WA Gateway', () => {
  it('tanpa pengaturan semua mati; ID grup harus berbentuk @g.us; kunci tidak pernah dikirim', async () => {
    expect((await cms('GET', '/wa-gateway')).json().data).toEqual({
      configured: true,
      notifications: {
        orderCustomer: false,
        orderGroup: null,
        careerGroup: null,
        digiposGroup: null,
      },
    });
    const wrong = await cms('PUT', '/wa-gateway', { ...settings, orderGroup: '081234567890' });
    expect(wrong.statusCode).toBe(422);
    const saved = await cms('PUT', '/wa-gateway', settings);
    expect(saved.statusCode).toBe(200);
    expect(saved.json().data.notifications).toEqual(settings);
    expect(saved.body).not.toMatch(/api[_-]?key|https?:/i);
  });

  it('pesan uji: ditolak bila grup belum disimpan; gagal WAHA dilaporkan gagal', async () => {
    expect((await cms('POST', '/wa-gateway/test', { target: 'orderGroup' })).statusCode).toBe(409);
    await cms('PUT', '/wa-gateway', settings);
    expect((await cms('POST', '/wa-gateway/test', { target: 'orderGroup' })).statusCode).toBe(204);
    expect(wa.sent).toEqual([{ chatId: ORDER_GROUP, text: expect.stringContaining('Pesan uji') }]);
    wa.fail = true;
    const failed = await cms('POST', '/wa-gateway/test', { target: 'careerGroup' });
    expect(failed.statusCode).toBe(503);
    expect(failed.json().error.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('hanya sesi Admin Web yang boleh mengubah', async () => {
    await createStaff(ctx.db, { username: 'adminmobile', role: 'admin', unit: 'mobile' });
    const response = await ctx.app.inject({
      method: 'PUT',
      url: '/web-admin/api/v1/wa-gateway',
      headers: { cookie: await loginStaff(ctx.app, 'adminmobile'), origin: ORIGIN.portal },
      payload: settings,
    });
    expect(response.statusCode).toBe(401);
  });
});

async function outletOrder(phone: string) {
  const category = newId();
  const pkg = newId();
  await ctx.db
    .insertInto('outletCategories')
    .values({ id: category, name: 'Perdana', sortOrder: 1 })
    .execute();
  await ctx.db
    .insertInto('outletPackages')
    .values({
      id: pkg,
      categoryId: category,
      name: 'Paket Uji',
      description: '',
      contents: '1 perdana',
      unitPriceRupiah: 420_000,
      minQty: 1,
      maxQty: null,
      multipleOf: 1,
      thumbnailUrl: null,
      status: 'published',
    })
    .execute();
  const outletId = await createOutlet(ctx.db, 'OUTLETWA');
  await ctx.db.updateTable('outletAccounts').set({ phone }).where('id', '=', outletId).execute();
  const cookie = await loginOutlet(ctx.app, 'OUTLETWA');
  const quote = await ctx.app.inject({
    method: 'POST',
    url: '/api/v1/outlet/quotes',
    headers: { cookie, origin: ORIGIN.outlet },
    payload: { items: [{ packageId: pkg, qty: 2 }] },
  });
  const key = idemKey();
  return () =>
    ctx.app.inject({
      method: 'POST',
      url: '/api/v1/outlet/orders',
      headers: { cookie, origin: ORIGIN.outlet, 'idempotency-key': key },
      payload: { quoteId: quote.json().id },
    });
}

describe('notifikasi order ABKShop Outlet', () => {
  it('grup dan outlet diberi tahu sekali; kirim ulang idempoten tidak mengirim lagi', async () => {
    await cms('PUT', '/wa-gateway', settings);
    const send = await outletOrder('081234567890');
    const first = await send();
    expect(first.statusCode).toBe(201);
    await vi.waitFor(() => expect(wa.sent).toHaveLength(2));
    expect(wa.sent.map((item) => item.chatId).sort()).toEqual(
      ['6281234567890@c.us', ORDER_GROUP].sort(),
    );
    for (const item of wa.sent) {
      expect(item.text).toContain(first.json().number);
      expect(item.text).toMatch(/Rp\s?840\.000/);
    }
    expect((await send()).statusCode).toBe(200);
    await settle();
    expect(wa.sent).toHaveLength(2);
  });

  it('WAHA gagal tidak menggagalkan order', async () => {
    await cms('PUT', '/wa-gateway', settings);
    wa.fail = true;
    const send = await outletOrder('081234567890');
    expect((await send()).statusCode).toBe(201);
    const stored = await ctx.db
      .selectFrom('outletOrders')
      .select('status')
      .executeTakeFirstOrThrow();
    expect(stored.status).toBe('diajukan');
  });

  it('tanpa pengaturan tidak ada pesan', async () => {
    const send = await outletOrder('081234567890');
    expect((await send()).statusCode).toBe(201);
    await settle();
    expect(wa.sent).toEqual([]);
  });

  it('nomor HP outlet tidak sah: hanya grup yang diberi tahu', async () => {
    await cms('PUT', '/wa-gateway', settings);
    const send = await outletOrder('0231123456');
    expect((await send()).statusCode).toBe(201);
    await vi.waitFor(() => expect(wa.sent).toHaveLength(1));
    await settle();
    expect(wa.sent.map((item) => item.chatId)).toEqual([ORDER_GROUP]);
  });
});

describe('notifikasi form publik', () => {
  it('grup menerima nomor referensi tanpa data pribadi pengirim', async () => {
    await cms('PUT', '/wa-gateway', settings);
    const digipos = await ctx.app.inject({
      method: 'POST',
      url: '/api/public/v1/forms/digipos-registration',
      headers: { origin: ORIGIN.public, 'idempotency-key': idemKey() },
      payload: {
        outletName: 'Toko Uji',
        name: 'Pemilik Uji',
        phone: '081234567890',
        address: 'Jalan Uji 1',
      },
    });
    expect(digipos.statusCode).toBe(201);

    await ctx.db
      .insertInto('vacancies')
      .values({
        id: newId(),
        slug: 'buka',
        title: 'Posisi uji',
        unit: 'Mobile',
        location: 'Cirebon',
        summary: '',
        requirements: '[]',
        employmentType: 'Kontrak',
        closesAt: '2099-12-31',
        status: 'open',
      })
      .execute();
    const body = multipart(
      { name: 'Pelamar Uji', email: 'pelamar@contoh.test', phone: '081234567890', consent: 'on' },
      { field: 'cv', name: 'cv.pdf', type: 'application/pdf', data: SAMPLE_PDF },
    );
    const application = await ctx.app.inject({
      method: 'POST',
      url: '/api/public/v1/forms/job-application/buka',
      headers: {
        origin: ORIGIN.public,
        'idempotency-key': idemKey(),
        'content-type': body.contentType,
      },
      payload: body.payload,
    });
    expect(application.statusCode).toBe(201);

    await vi.waitFor(() => expect(wa.sent).toHaveLength(2));
    const byGroup = Object.fromEntries(wa.sent.map((item) => [item.chatId, item.text]));
    expect(byGroup[DIGIPOS_GROUP]).toContain(digipos.json().reference);
    expect(byGroup[CAREER_GROUP]).toContain(application.json().reference);
    for (const text of Object.values(byGroup)) {
      expect(text).not.toMatch(/Toko Uji|Pemilik Uji|Pelamar Uji|081234567890|pelamar@contoh/);
    }
  });

  it('pesan Hubungi Kami tidak memicu notifikasi', async () => {
    await cms('PUT', '/wa-gateway', settings);
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/public/v1/forms/contact',
      headers: { origin: ORIGIN.public, 'idempotency-key': idemKey() },
      payload: {
        name: 'Uji',
        phone: '081234567890',
        topic: 'produk',
        message: 'Pesan uji cukup panjang.',
      },
    });
    expect(response.statusCode).toBe(201);
    await settle();
    expect(wa.sent).toEqual([]);
  });
});
