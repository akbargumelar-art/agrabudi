import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  ORIGIN,
  PASSWORD,
  createOutlet,
  createStaff,
  createTestContext,
  loginOutlet,
  loginStaff,
  resetDatabase,
  type TestContext,
} from './helpers';

let ctx: TestContext;

beforeAll(async () => {
  ctx = await createTestContext();
});
afterAll(async () => ctx.close());
beforeEach(async () => {
  await resetDatabase(ctx.db);
});

describe('login Portal dan realm sesi', () => {
  it('akun operasional mendapat cookie staff host-only, HttpOnly, Secure, SameSite=Strict', async () => {
    await createStaff(ctx.db, {
      username: 'adminmobile',
      role: 'admin',
      unit: 'mobile',
      permissions: ['career.manage'],
    });
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { origin: ORIGIN.portal },
      payload: { username: 'AdminMobile ', password: PASSWORD },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      username: 'adminmobile',
      role: 'admin',
      unit: 'mobile',
      permissions: ['career.manage'],
    });
    const cookie = response.cookies.find((item) => item.value !== '');
    expect(cookie).toMatchObject({
      name: '__Host-abk_staff',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
    });
    expect(cookie?.domain).toBeUndefined();
    // Cookie realm Admin Web di browser yang sama ikut dihapus: tidak ada dua sesi dari satu login.
    expect(response.cookies.find((item) => item.name === '__Secure-abk_webadmin')?.value).toBe('');
    expect(response.body).not.toContain('passwordHash');
  });

  it('username salah dan kata sandi salah dijawab sama', async () => {
    await createStaff(ctx.db, { username: 'manager', role: 'manager' });
    const wrongPassword = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { origin: ORIGIN.portal },
      payload: { username: 'manager', password: 'salah-sekali' },
    });
    const unknownUser = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { origin: ORIGIN.portal },
      payload: { username: 'tidakada', password: PASSWORD },
    });
    expect(wrongPassword.statusCode).toBe(401);
    expect(unknownUser.statusCode).toBe(401);
    expect(wrongPassword.json().error.message).toBe(unknownUser.json().error.message);
    expect(wrongPassword.cookies).toHaveLength(0);
  });

  it('akun nonaktif tidak bisa masuk', async () => {
    await createStaff(ctx.db, { username: 'nonaktif', role: 'manager', status: 'disabled' });
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { origin: ORIGIN.portal },
      payload: { username: 'nonaktif', password: PASSWORD },
    });
    expect(response.statusCode).toBe(401);
  });

  it('Admin Web mendapat sesi realm terpisah dengan path /web-admin dan tidak bisa memakai API operasional', async () => {
    await createStaff(ctx.db, { username: 'adminweb', role: 'web_admin' });
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { origin: ORIGIN.portal },
      payload: { username: 'adminweb', password: PASSWORD },
    });
    expect(response.statusCode).toBe(200);
    const webAdminCookie = response.cookies.find((cookie) => cookie.value !== '');
    expect(webAdminCookie).toMatchObject({
      name: '__Secure-abk_webadmin',
      path: '/web-admin',
      httpOnly: true,
      secure: true,
    });
    const cookie = `${webAdminCookie?.name}=${webAdminCookie?.value}`;

    const cms = await ctx.app.inject({
      method: 'GET',
      url: '/web-admin/api/v1/auth/me',
      headers: { cookie },
    });
    expect(cms.statusCode).toBe(200);
    expect(cms.json()).toMatchObject({ role: 'web_admin', scope: 'site' });

    // Token web admin yang dipaksa masuk sebagai cookie staff tetap ditolak: realm tidak cocok.
    const forged = `__Host-abk_staff=${webAdminCookie?.value}`;
    for (const url of ['/api/v1/auth/me', '/api/v1/modules?path=/admin/kelola-karir/lowongan']) {
      const staff = await ctx.app.inject({
        method: 'GET',
        url,
        headers: { cookie: `${cookie}; ${forged}` },
      });
      expect(staff.statusCode).toBe(401);
    }
  });

  it('akun operasional ditolak di CMS API, termasuk Admin dan Manager', async () => {
    await createStaff(ctx.db, { username: 'adminmobile', role: 'admin', unit: 'mobile' });
    const cookie = await loginStaff(ctx.app, 'adminmobile');
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/web-admin/api/v1/pages',
      headers: { cookie },
    });
    expect(response.statusCode).toBe(401);
  });

  it('logout mencabut sesi di server, bukan sekadar menghapus cookie', async () => {
    await createStaff(ctx.db, { username: 'manager', role: 'manager' });
    const cookie = await loginStaff(ctx.app, 'manager');
    const logout = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      headers: { cookie, origin: ORIGIN.portal },
    });
    expect(logout.statusCode).toBe(204);
    const me = await ctx.app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: { cookie } });
    expect(me.statusCode).toBe(401);
  });

  it('sesi yang melewati batas idle ditolak', async () => {
    await createStaff(ctx.db, { username: 'manager', role: 'manager' });
    const cookie = await loginStaff(ctx.app, 'manager');
    await ctx.db
      .updateTable('sessions')
      .set({ lastSeenAt: new Date(Date.now() - 3 * 60 * 60 * 1000) })
      .execute();
    const me = await ctx.app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: { cookie } });
    expect(me.statusCode).toBe(401);
  });

  it('akun yang dinonaktifkan kehilangan akses pada permintaan berikutnya', async () => {
    const id = await createStaff(ctx.db, { username: 'manager', role: 'manager' });
    const cookie = await loginStaff(ctx.app, 'manager');
    await ctx.db
      .updateTable('staffAccounts')
      .set({ status: 'disabled' })
      .where('id', '=', id)
      .execute();
    const me = await ctx.app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: { cookie } });
    expect(me.statusCode).toBe(401);
  });

  it('ubah profil tidak bisa ikut mengubah username, peran, atau izin', async () => {
    await createStaff(ctx.db, {
      username: 'sfmobile',
      role: 'salesforce',
      unit: 'mobile',
      scope: 'self',
    });
    const cookie = await loginStaff(ctx.app, 'sfmobile');
    const response = await ctx.app.inject({
      method: 'PATCH',
      url: '/api/v1/auth/profile',
      headers: { cookie, origin: ORIGIN.portal },
      payload: {
        displayName: 'Nama Baru',
        email: null,
        phone: '081234567890',
        username: 'bos',
        role: 'admin',
        permissions: ['user.manage'],
      },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      displayName: 'Nama Baru',
      phone: '081234567890',
      username: 'sfmobile',
      role: 'salesforce',
      permissions: [],
    });
  });
});

describe('perlindungan CSRF lewat Origin', () => {
  it('aksi yang mengubah data tanpa Origin atau dari origin aplikasi lain ditolak', async () => {
    await createStaff(ctx.db, { username: 'manager', role: 'manager' });
    const payload = { username: 'manager', password: PASSWORD };
    const none = await ctx.app.inject({ method: 'POST', url: '/api/v1/auth/login', payload });
    const sibling = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { origin: ORIGIN.outlet },
      payload,
    });
    const foreign = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { origin: 'https://contoh-jahat.test' },
      payload,
    });
    for (const response of [none, sibling, foreign]) {
      expect(response.statusCode).toBe(403);
      expect(response.json().error.code).toBe('ORIGIN_REJECTED');
    }
  });
});

describe('login Outlet', () => {
  it('ID Digipos dibaca sebagai teks huruf besar; nol di depan tetap', async () => {
    await createOutlet(ctx.db, '0012345');
    const cookie = await loginOutlet(ctx.app, '0012345');
    expect(cookie).toContain('__Host-abk_outlet=');
    const me = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/outlet/auth/me',
      headers: { cookie },
    });
    expect(me.json()).toMatchObject({ digiposId: '0012345' });
  });

  it('sesi outlet tidak berlaku di API Portal, dan sesi staff tidak berlaku di API Outlet', async () => {
    await createOutlet(ctx.db, 'CIR001');
    await createStaff(ctx.db, { username: 'adminmobile', role: 'admin', unit: 'mobile' });
    const outlet = await loginOutlet(ctx.app, 'CIR001');
    const staff = await loginStaff(ctx.app, 'adminmobile');
    expect(
      (await ctx.app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: { cookie: outlet } }))
        .statusCode,
    ).toBe(401);
    expect(
      (
        await ctx.app.inject({
          method: 'GET',
          url: '/api/v1/outlet/catalog',
          headers: { cookie: staff },
        })
      ).statusCode,
    ).toBe(401);
  });
});

describe('batas laju login', () => {
  it('percobaan ke-11 dalam 5 menit dari IP yang sama ditolak 429', async () => {
    const limited = await createTestContext({ RATE_LIMIT_ENABLED: 'true' });
    try {
      const attempt = () =>
        limited.app.inject({
          method: 'POST',
          url: '/api/v1/auth/login',
          headers: { origin: ORIGIN.portal },
          payload: { username: 'siapa', password: 'salah-salah' },
        });
      for (let i = 0; i < 10; i++) expect((await attempt()).statusCode).toBe(401);
      const blocked = await attempt();
      expect(blocked.statusCode).toBe(429);
      expect(blocked.json().error.code).toBe('RATE_LIMITED');
    } finally {
      await limited.close();
    }
  });
});
