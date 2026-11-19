import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  ORIGIN,
  PASSWORD,
  cookieHeader,
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

beforeAll(async () => {
  wa = fakeWa();
  ctx = await createTestContext({}, wa);
});
afterAll(async () => ctx.close());
beforeEach(async () => {
  await resetDatabase(ctx.db);
  wa.sent.length = 0;
  wa.fail = false;
});

const NEW_PASSWORD = 'kata-sandi-baru-456';
const settle = () => new Promise((resolve) => setTimeout(resolve, 50));
const post = (
  url: string,
  payload: Record<string, unknown>,
  cookie?: string,
  origin: string = ORIGIN.portal,
) =>
  ctx.app.inject({
    method: 'POST',
    url,
    headers: { origin, ...(cookie ? { cookie } : {}) },
    payload,
  });
const get = (url: string, cookie: string) =>
  ctx.app.inject({ method: 'GET', url, headers: { cookie } });
/** Kode 6 angka dari pesan WhatsApp tiruan ke-n (bawaan: terakhir). */
const codeAt = (index = -1) => /(\d{6})/.exec(wa.sent.at(index)?.text ?? '')?.[1] ?? '';

describe('kata sandi sementara wajib diganti', () => {
  it('sesi dengan kata sandi sementara hanya bisa me, ganti kata sandi, dan keluar', async () => {
    await createStaff(ctx.db, {
      username: 'baru',
      role: 'admin',
      unit: 'mobile',
      mustChangePassword: true,
    });
    const cookie = await loginStaff(ctx.app, 'baru');
    const me = await get('/api/v1/auth/me', cookie);
    expect(me.statusCode).toBe(200);
    expect(me.json().mustChangePassword).toBe(true);

    // Kontrol akses di server, bukan hanya pengalihan di browser.
    const blocked = await get('/api/v1/modules?path=/admin/abkshop-outlet/order-masuk', cookie);
    expect(blocked.statusCode).toBe(403);
    expect(blocked.json().error.code).toBe('PASSWORD_CHANGE_REQUIRED');

    const wrong = await post(
      '/api/v1/auth/password',
      { currentPassword: 'salah-sekali', newPassword: NEW_PASSWORD },
      cookie,
    );
    expect(wrong.statusCode).toBe(422);
    expect(wrong.json().error.fields.currentPassword).toBeDefined();

    const changed = await post(
      '/api/v1/auth/password',
      { currentPassword: PASSWORD, newPassword: NEW_PASSWORD },
      cookie,
    );
    expect(changed.statusCode).toBe(204);
    const fresh = cookieHeader(changed);
    // Sesi lama dicabut; browser ini mendapat sesi baru.
    expect((await get('/api/v1/auth/me', cookie)).statusCode).toBe(401);
    expect((await get('/api/v1/auth/me', fresh)).json().mustChangePassword).toBe(false);
    const relogin = await post('/api/v1/auth/login', { username: 'baru', password: NEW_PASSWORD });
    expect(relogin.statusCode).toBe(200);
  });

  it('kata sandi baru minimal 12 karakter dan berbeda dari yang lama', async () => {
    await createStaff(ctx.db, { username: 'pendek', role: 'manager' });
    const cookie = await loginStaff(ctx.app, 'pendek');
    const short = await post(
      '/api/v1/auth/password',
      { currentPassword: PASSWORD, newPassword: 'pendek' },
      cookie,
    );
    const same = await post(
      '/api/v1/auth/password',
      { currentPassword: PASSWORD, newPassword: PASSWORD },
      cookie,
    );
    expect(short.statusCode).toBe(422);
    expect(same.statusCode).toBe(422);
  });

  it('Admin Web dengan kata sandi sementara tidak bisa memakai CMS sampai menggantinya', async () => {
    await createStaff(ctx.db, { username: 'adminweb', role: 'web_admin', mustChangePassword: true });
    const cookie = await loginStaff(ctx.app, 'adminweb');
    const pages = await get('/web-admin/api/v1/pages', cookie);
    expect(pages.json().error.code).toBe('PASSWORD_CHANGE_REQUIRED');
    expect((await get('/web-admin/api/v1/auth/me', cookie)).statusCode).toBe(200);
    const changed = await post(
      '/web-admin/api/v1/auth/password',
      { currentPassword: PASSWORD, newPassword: NEW_PASSWORD },
      cookie,
    );
    expect(changed.statusCode).toBe(204);
    const fresh = cookieHeader(changed);
    expect(fresh).toContain('__Secure-abk_webadmin=');
    expect((await get('/web-admin/api/v1/pages', fresh)).statusCode).toBe(200);
  });

  it('outlet dengan kata sandi sementara tidak bisa membuka katalog sampai menggantinya', async () => {
    await createOutlet(ctx.db, 'CIR900', { mustChangePassword: true });
    const cookie = await loginOutlet(ctx.app, 'CIR900');
    expect((await get('/api/v1/outlet/catalog', cookie)).json().error.code).toBe(
      'PASSWORD_CHANGE_REQUIRED',
    );
    const changed = await post(
      '/api/v1/outlet/auth/password',
      { currentPassword: PASSWORD, newPassword: NEW_PASSWORD },
      cookie,
      ORIGIN.outlet,
    );
    expect(changed.statusCode).toBe(204);
    expect((await get('/api/v1/outlet/catalog', cookieHeader(changed))).statusCode).toBe(200);
  });
});

describe('reset kata sandi mandiri lewat WhatsApp', () => {
  it('kode dikirim ke nomor akun dan dipakai sekali; semua sesi lama dicabut', async () => {
    await createStaff(ctx.db, { username: 'lupa', role: 'manager', phone: '081234567890' });
    const oldSession = await loginStaff(ctx.app, 'lupa');
    const requested = await post('/api/v1/auth/password-reset/request', { identifier: 'Lupa' });
    expect(requested.statusCode).toBe(202);
    await settle();
    expect(wa.sent).toHaveLength(1);
    expect(wa.sent[0]?.chatId).toBe('6281234567890@c.us');
    const code = codeAt();
    expect(code).toMatch(/^\d{6}$/);
    expect(requested.body).not.toContain(code);

    const confirmed = await post('/api/v1/auth/password-reset/confirm', {
      identifier: 'lupa',
      code,
      newPassword: NEW_PASSWORD,
    });
    expect(confirmed.statusCode).toBe(204);
    expect((await get('/api/v1/auth/me', oldSession)).statusCode).toBe(401);
    const login = await post('/api/v1/auth/login', { username: 'lupa', password: NEW_PASSWORD });
    expect(login.statusCode).toBe(200);
    expect(login.json().mustChangePassword).toBe(false);

    const reuse = await post('/api/v1/auth/password-reset/confirm', {
      identifier: 'lupa',
      code,
      newPassword: 'kata-sandi-ketiga-789',
    });
    expect(reuse.statusCode).toBe(422);
  });

  it('akun tidak ada, tanpa nomor, atau nonaktif dijawab sama dan tidak mengirim apa pun', async () => {
    await createStaff(ctx.db, { username: 'tanpanomor', role: 'manager' });
    await createStaff(ctx.db, {
      username: 'mati',
      role: 'manager',
      phone: '081200000001',
      status: 'disabled',
    });
    const messages: string[] = [];
    for (const identifier of ['tidakada', 'tanpanomor', 'mati']) {
      const response = await post('/api/v1/auth/password-reset/request', { identifier });
      expect(response.statusCode).toBe(202);
      messages.push(response.json().message);
    }
    await settle();
    expect(new Set(messages).size).toBe(1);
    expect(wa.sent).toHaveLength(0);
  });

  it('kode gugur setelah 5 kali salah', async () => {
    await createStaff(ctx.db, { username: 'tebak', role: 'manager', phone: '081234567891' });
    await post('/api/v1/auth/password-reset/request', { identifier: 'tebak' });
    await settle();
    const code = codeAt();
    const wrong = code === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++) {
      const attempt = await post('/api/v1/auth/password-reset/confirm', {
        identifier: 'tebak',
        code: wrong,
        newPassword: NEW_PASSWORD,
      });
      expect(attempt.statusCode).toBe(422);
    }
    const late = await post('/api/v1/auth/password-reset/confirm', {
      identifier: 'tebak',
      code,
      newPassword: NEW_PASSWORD,
    });
    expect(late.statusCode).toBe(422);
  });

  it('kode baru menggugurkan kode lama, dan maksimal 3 kode per jam per akun', async () => {
    await createStaff(ctx.db, { username: 'ulang', role: 'manager', phone: '081234567892' });
    for (let i = 0; i < 4; i++) {
      await post('/api/v1/auth/password-reset/request', { identifier: 'ulang' });
    }
    await settle();
    expect(wa.sent).toHaveLength(3);
    const first = codeAt(0);
    const latest = codeAt();
    if (first !== latest) {
      const old = await post('/api/v1/auth/password-reset/confirm', {
        identifier: 'ulang',
        code: first,
        newPassword: NEW_PASSWORD,
      });
      expect(old.statusCode).toBe(422);
    }
    const ok = await post('/api/v1/auth/password-reset/confirm', {
      identifier: 'ulang',
      code: latest,
      newPassword: NEW_PASSWORD,
    });
    expect(ok.statusCode).toBe(204);
  });

  it('outlet reset lewat ID Digipos dari origin Outlet', async () => {
    await createOutlet(ctx.db, '0012345', { phone: '081234567893' });
    const requested = await post(
      '/api/v1/outlet/auth/password-reset/request',
      { identifier: '0012345' },
      undefined,
      ORIGIN.outlet,
    );
    expect(requested.statusCode).toBe(202);
    await settle();
    expect(wa.sent[0]?.text).toContain('Agrabudi Outlet');
    const confirmed = await post(
      '/api/v1/outlet/auth/password-reset/confirm',
      { identifier: '0012345', code: codeAt(), newPassword: NEW_PASSWORD },
      undefined,
      ORIGIN.outlet,
    );
    expect(confirmed.statusCode).toBe(204);
  });

  it('tanpa WAHA dijawab 503 dengan saran menghubungi admin, bukan sukses palsu', async () => {
    const plain = await createTestContext({}, null);
    try {
      const response = await plain.app.inject({
        method: 'POST',
        url: '/api/v1/auth/password-reset/request',
        headers: { origin: ORIGIN.portal },
        payload: { identifier: 'siapa' },
      });
      expect(response.statusCode).toBe(503);
      expect(response.json().error.message).toContain('Hubungi admin');
    } finally {
      await plain.close();
    }
  });
});

