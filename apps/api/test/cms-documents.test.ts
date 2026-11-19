import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  ORIGIN,
  createStaff,
  createTestContext,
  loginStaff,
  resetDatabase,
  type TestContext,
} from './helpers';

let ctx: TestContext;
let webAdmin: string;

beforeAll(async () => {
  ctx = await createTestContext();
});
afterAll(async () => ctx.close());
beforeEach(async () => {
  await resetDatabase(ctx.db);
  await createStaff(ctx.db, { username: 'adminweb', role: 'web_admin' });
  webAdmin = await loginStaff(ctx.app, 'adminweb');
});

const cms = (method: 'GET' | 'PUT', url: string, payload?: unknown) =>
  ctx.app.inject({
    method,
    url: `/web-admin/api/v1${url}`,
    headers: { cookie: webAdmin, ...(method === 'GET' ? {} : { origin: ORIGIN.portal }) },
    ...(payload === undefined ? {} : { payload: payload as Record<string, unknown> }),
  });

describe('editor profil per bagian', () => {
  it('belum diisi dijawab null; simpan satu bagian tidak menimpa bagian lain', async () => {
    expect((await cms('GET', '/company-profile/about')).json().data).toBeNull();

    const about = { about: ['Paragraf.'], history: [], vision: 'Visi.', missions: ['Misi.'] };
    expect((await cms('PUT', '/company-profile/about', about)).statusCode).toBe(200);
    const channels = {
      channels: [{ kind: 'email', label: 'Email', value: 'kontak@contoh.test' }],
    };
    expect((await cms('PUT', '/company-profile/channels', channels)).statusCode).toBe(200);

    expect((await cms('GET', '/company-profile/about')).json().data).toEqual(about);
    const live = await ctx.app.inject({ method: 'GET', url: '/api/public/v1/company-profile' });
    expect(live.json().data).toEqual({ ...about, ...channels, areas: [], offices: [] });
    const audit = (await cms('GET', '/audit')).json().data;
    expect(audit.map((event: { object: string }) => event.object)).toEqual(
      expect.arrayContaining(['Tentang Kami', 'Hubungi Kami']),
    );
  });

  it('bagian lain di badan permintaan ditolak; foto kantor harus dari Aset Website', async () => {
    expect(
      (await cms('PUT', '/company-profile/areas', { areas: [], vision: 'Selundupan' })).statusCode,
    ).toBe(422);
    const office = {
      id: 'kantor-1',
      name: 'Kantor',
      address: 'Alamat',
      hours: 'Jam',
      phone: '0231',
      imageUrl: 'https://situs-lain.test/foto.png',
    };
    expect((await cms('PUT', '/company-profile/offices', { offices: [office] })).statusCode).toBe(
      422,
    );
    const ok = await cms('PUT', '/company-profile/offices', {
      offices: [{ ...office, imageUrl: `${ORIGIN.public}/media/2026/11/foto.png` }],
    });
    expect(ok.statusCode).toBe(200);
    expect((await cms('GET', '/company-profile/nama-lain')).statusCode).toBe(422);
  });
});

describe('area layanan: koordinat dan foto', () => {
  it('foto wilayah harus dari Aset Website; koordinat tersimpan dan tampil di Publik', async () => {
    const area = {
      name: 'Wilayah Uji',
      districts: ['Kecamatan Uji'],
      latitude: -6.732,
      longitude: 108.5523,
      imageUrl: 'https://situs-lain.test/foto.png',
    };
    expect((await cms('PUT', '/company-profile/areas', { areas: [area] })).statusCode).toBe(422);
    expect(
      (await cms('PUT', '/company-profile/areas', { areas: [{ ...area, longitude: null }] }))
        .statusCode,
    ).toBe(422);

    const saved = { ...area, imageUrl: `${ORIGIN.public}/media/2026/11/wilayah.png` };
    expect((await cms('PUT', '/company-profile/areas', { areas: [saved] })).statusCode).toBe(200);
    const live = await ctx.app.inject({ method: 'GET', url: '/api/public/v1/company-profile' });
    expect(live.json().data.areas).toEqual([saved]);
  });

  it('wilayah yang disimpan sebelum ada koordinat tetap terbaca dengan nilai kosong', async () => {
    await ctx.db
      .insertInto('siteDocuments')
      .values({
        key: 'company_profile',
        body: JSON.stringify({
          about: [],
          history: [],
          vision: '',
          missions: [],
          areas: [{ name: 'Lama', districts: [] }],
          offices: [],
          channels: [],
        }),
        updatedBy: null,
      })
      .execute();
    expect((await cms('GET', '/company-profile/areas')).json().data).toEqual({
      areas: [{ name: 'Lama', districts: [], latitude: null, longitude: null, imageUrl: null }],
    });
  });
});

describe('teks halaman Daftar Digipos', () => {
  it('disimpan Admin Web lalu tampil di Publik', async () => {
    expect((await cms('GET', '/digipos-info')).json().data).toBeNull();
    const info = { requirements: ['Syarat satu.'], steps: ['Langkah satu.'] };
    expect((await cms('PUT', '/digipos-info', { ...info, steps: [''] })).statusCode).toBe(422);
    expect((await cms('PUT', '/digipos-info', info)).statusCode).toBe(200);
    const live = await ctx.app.inject({ method: 'GET', url: '/api/public/v1/digipos-info' });
    expect(live.json().data).toEqual(info);
  });

  it('akun staff tidak bisa mengubah teks website', async () => {
    await createStaff(ctx.db, { username: 'adminmobile', role: 'admin', unit: 'mobile' });
    const response = await ctx.app.inject({
      method: 'PUT',
      url: '/web-admin/api/v1/digipos-info',
      headers: { cookie: await loginStaff(ctx.app, 'adminmobile'), origin: ORIGIN.portal },
      payload: { requirements: [], steps: [] },
    });
    expect(response.statusCode).toBe(401);
  });
});
