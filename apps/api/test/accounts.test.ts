import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  ORIGIN,
  PASSWORD,
  createOutlet,
  createStaff,
  createTestContext,
  fakeWa,
  loginOutlet,
  loginStaff,
  resetDatabase,
  type FakeWa,
  type TestContext,
} from './helpers';

let ctx: TestContext;
let wa: FakeWa;
let admin: string;

beforeAll(async () => {
  wa = fakeWa();
  ctx = await createTestContext({}, wa);
});
afterAll(async () => ctx.close());
beforeEach(async () => {
  await resetDatabase(ctx.db);
  wa.sent.length = 0;
  wa.fail = false;
  await createStaff(ctx.db, {
    username: 'adminmobile',
    role: 'admin',
    unit: 'mobile',
    permissions: ['user.manage', 'career.manage'],
  });
  admin = await loginStaff(ctx.app, 'adminmobile');
});

const call = (
  method: 'GET' | 'POST' | 'PATCH',
  url: string,
  payload?: unknown,
  cookie: string = admin,
) =>
  ctx.app.inject({
    method,
    url: `/api/v1/admin/accounts${url}`,
    headers: { cookie, ...(method === 'GET' ? {} : { origin: ORIGIN.portal }) },
    ...(payload === undefined ? {} : { payload: payload as Record<string, unknown> }),
  });

const loginWith = (username: string, password: string) =>
  ctx.app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    headers: { origin: ORIGIN.portal },
    payload: { username, password },
  });

/** Kata sandi sementara dari pesan WhatsApp tiruan terakhir. */
const sentPassword = () =>
  /Kata sandi sementara: (\S+)/.exec(wa.sent.at(-1)?.text ?? '')?.[1] ?? '';

const newSalesforce = {
  username: 'SF.Baru',
  displayName: 'Salesforce Baru',
  phone: '081234500001',
  role: 'salesforce',
  unit: 'mobile',
  permissions: [],
};

describe('User Management: membuat akun Portal', () => {
  it('kata sandi acak dikirim lewat WhatsApp, tidak ke browser; login pertama wajib ganti', async () => {
    const created = await call('POST', '/staff', newSalesforce);
    expect(created.statusCode).toBe(201);
    expect(created.json().delivery).toEqual({ channel: 'whatsapp', maskedPhone: '0812****0001' });
    const password = sentPassword();
    expect(password).toMatch(/^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/);
    expect(created.body).not.toContain(password);
    expect(wa.sent.at(-1)?.chatId).toBe('6281234500001@c.us');
    expect(wa.sent.at(-1)?.text).toContain('sf.baru');

    const login = await loginWith('sf.baru', password);
    expect(login.statusCode).toBe(200);
    expect(login.json()).toMatchObject({
      role: 'salesforce',
      unit: 'mobile',
      scope: 'self',
      mustChangePassword: true,
    });

    const audit = await ctx.db
      .selectFrom('auditEvents')
      .select(['action', 'objectLabel'])
      .where('action', '=', 'account.create')
      .execute();
    expect(audit).toEqual([{ action: 'account.create', objectLabel: 'sf.baru' }]);
  });

  it('WAHA gagal berarti akun tidak dibuat', async () => {
    wa.fail = true;
    const failed = await call('POST', '/staff', newSalesforce);
    expect(failed.statusCode).toBe(503);
    const exists = await ctx.db
      .selectFrom('staffAccounts')
      .select('id')
      .where('username', '=', 'sf.baru')
      .executeTakeFirst();
    expect(exists).toBeUndefined();
  });

  it('WAHA tidak dikonfigurasi dijawab 503, bukan akun tanpa kata sandi yang diketahui', async () => {
    const plain = await createTestContext({}, null);
    try {
      await resetDatabase(plain.db);
      await createStaff(plain.db, {
        username: 'adminmobile',
        role: 'admin',
        unit: 'mobile',
        permissions: ['user.manage'],
      });
      const cookie = await loginStaff(plain.app, 'adminmobile');
      const response = await plain.app.inject({
        method: 'POST',
        url: '/api/v1/admin/accounts/staff',
        headers: { cookie, origin: ORIGIN.portal },
        payload: newSalesforce,
      });
      expect(response.statusCode).toBe(503);
    } finally {
      await plain.close();
    }
  });

  it('username ganda ditolak per kolom', async () => {
    await call('POST', '/staff', newSalesforce);
    const again = await call('POST', '/staff', { ...newSalesforce, phone: '081234500002' });
    expect(again.statusCode).toBe(422);
    expect(again.json().error.fields.username).toBe('Username sudah dipakai.');
  });

  it('tidak bisa membuat Manager/Admin Web atau memberi izin yang tidak dimiliki pemberi', async () => {
    expect((await call('POST', '/staff', { ...newSalesforce, role: 'manager' })).statusCode).toBe(422);
    expect((await call('POST', '/staff', { ...newSalesforce, role: 'web_admin' })).statusCode).toBe(422);
    const sfPermission = await call('POST', '/staff', {
      ...newSalesforce,
      permissions: ['career.manage'],
    });
    expect(sfPermission.statusCode).toBe(422);

    await createStaff(ctx.db, {
      username: 'adminterbatas',
      role: 'admin',
      unit: 'mobile',
      permissions: ['user.manage'],
    });
    const limited = await loginStaff(ctx.app, 'adminterbatas');
    const escalate = await call(
      'POST',
      '/staff',
      { ...newSalesforce, role: 'admin', permissions: ['career.manage'] },
      limited,
    );
    expect(escalate.statusCode).toBe(403);
  });
});

describe('User Management: akses dan cakupan', () => {
  it('hanya Admin berizin user.manage; Admin Household hanya melihat unitnya', async () => {
    await createStaff(ctx.db, {
      username: 'adminhh',
      role: 'admin',
      unit: 'household',
      permissions: ['user.manage'],
    });
    await createStaff(ctx.db, { username: 'adminpolos', role: 'admin', unit: 'mobile' });
    await createStaff(ctx.db, { username: 'manager', role: 'manager' });
    await createStaff(ctx.db, { username: 'sfhh', role: 'salesforce', unit: 'household' });
    for (const username of ['adminpolos', 'manager']) {
      const cookie = await loginStaff(ctx.app, username);
      expect((await call('GET', '/staff', undefined, cookie)).statusCode, username).toBe(403);
    }
    const household = await loginStaff(ctx.app, 'adminhh');
    expect((await call('POST', '/staff', newSalesforce, household)).statusCode).toBe(403);
    const list = (await call('GET', '/staff', undefined, household)).json().data;
    expect(list.map((item: { username: string }) => item.username).sort()).toEqual([
      'adminhh',
      'sfhh',
    ]);
    // Manager tidak tampil dan tidak bisa diubah dari menu ini.
    const managerRow = await ctx.db
      .selectFrom('staffAccounts')
      .select('id')
      .where('username', '=', 'manager')
      .executeTakeFirstOrThrow();
    const touch = await call('PATCH', `/staff/${managerRow.id}`, {
      displayName: 'X',
      phone: '081200000000',
      status: 'disabled',
    });
    expect(touch.statusCode).toBe(404);
    // Akun Outlet hanya dikelola Admin Mobile.
    expect((await call('GET', '/outlets', undefined, household)).statusCode).toBe(403);
  });
});


describe('User Management: reset oleh admin dan nonaktif', () => {
  it('reset admin mengirim kata sandi sementara ke WA, mencabut sesi, dan wajib ganti lagi', async () => {
    const id = await createStaff(ctx.db, {
      username: 'sfmobile',
      role: 'salesforce',
      unit: 'mobile',
      phone: '081234500003',
    });
    const oldSession = await loginStaff(ctx.app, 'sfmobile');
    const reset = await call('POST', `/staff/${id}/reset-password`);
    expect(reset.statusCode).toBe(200);
    expect(reset.json().delivery.channel).toBe('whatsapp');
    const password = sentPassword();
    expect(reset.body).not.toContain(password);
    const me = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { cookie: oldSession },
    });
    expect(me.statusCode).toBe(401);
    expect((await loginWith('sfmobile', PASSWORD)).statusCode).toBe(401);
    const login = await loginWith('sfmobile', password);
    expect(login.json().mustChangePassword).toBe(true);
  });

  it('reset gagal kirim tidak mengubah kata sandi lama', async () => {
    const id = await createStaff(ctx.db, {
      username: 'sfmobile',
      role: 'salesforce',
      unit: 'mobile',
      phone: '081234500003',
    });
    wa.fail = true;
    expect((await call('POST', `/staff/${id}/reset-password`)).statusCode).toBe(503);
    expect((await loginWith('sfmobile', PASSWORD)).statusCode).toBe(200);
  });

  it('akun tanpa nomor, akun sendiri, dan akun nonaktif tidak bisa direset', async () => {
    const noPhone = await createStaff(ctx.db, { username: 'tanpahp', role: 'salesforce', unit: 'mobile' });
    expect((await call('POST', `/staff/${noPhone}/reset-password`)).statusCode).toBe(422);
    const self = (await call('GET', '/staff')).json().data.find(
      (item: { isSelf: boolean }) => item.isSelf,
    );
    expect((await call('POST', `/staff/${self.id}/reset-password`)).statusCode).toBe(409);
    const disabled = await createStaff(ctx.db, {
      username: 'mati',
      role: 'salesforce',
      unit: 'mobile',
      phone: '081234500004',
      status: 'disabled',
    });
    expect((await call('POST', `/staff/${disabled}/reset-password`)).statusCode).toBe(409);
    expect(wa.sent).toHaveLength(0);
  });

  it('menonaktifkan akun mencabut sesinya; akun sendiri tidak bisa dinonaktifkan', async () => {
    const id = await createStaff(ctx.db, {
      username: 'sfmobile',
      role: 'salesforce',
      unit: 'mobile',
      phone: '081234500003',
    });
    const session = await loginStaff(ctx.app, 'sfmobile');
    const update = { displayName: 'SF Mobile', phone: '081234500003', status: 'disabled' };
    expect((await call('PATCH', `/staff/${id}`, update)).statusCode).toBe(200);
    const me = await ctx.app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: { cookie: session } });
    expect(me.statusCode).toBe(401);
    const self = (await call('GET', '/staff')).json().data.find(
      (item: { isSelf: boolean }) => item.isSelf,
    );
    expect((await call('PATCH', `/staff/${self.id}`, update)).statusCode).toBe(409);
  });
});

describe('User Management: akun Outlet', () => {
  it('Admin Mobile membuat akun outlet; ID Digipos tetap teks; kata sandi lewat WA', async () => {
    const created = await call('POST', '/outlets', {
      digiposId: '0012345',
      outletName: 'Outlet Baru',
      ownerName: 'Pemilik Baru',
      tap: null,
      phone: '081234500010',
      registeredAt: '2026-11-01',
    });
    expect(created.statusCode).toBe(201);
    const password = sentPassword();
    expect(wa.sent.at(-1)?.text).toContain('0012345');
    const login = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/outlet/auth/login',
      headers: { origin: ORIGIN.outlet },
      payload: { digiposId: '0012345', password },
    });
    expect(login.statusCode).toBe(200);
    expect(login.json().mustChangePassword).toBe(true);
    const list = (await call('GET', '/outlets')).json().data;
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ digiposId: '0012345', mustChangePassword: true });
    expect(JSON.stringify(list)).not.toContain('passwordHash');
  });

  it('reset outlet oleh admin mencabut sesi outlet', async () => {
    const id = await createOutlet(ctx.db, 'CIR001', { phone: '081234500011' });
    const session = await loginOutlet(ctx.app, 'CIR001');
    expect((await call('POST', `/outlets/${id}/reset-password`)).statusCode).toBe(200);
    const me = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/outlet/auth/me',
      headers: { cookie: session },
    });
    expect(me.statusCode).toBe(401);
  });
});

