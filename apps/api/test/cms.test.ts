import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { todayWib } from '../src/lib/http';
import {
  ORIGIN,
  SAMPLE_PNG,
  createStaff,
  createTestContext,
  loginStaff,
  multipart,
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

const cms = (
  method: 'GET' | 'PUT' | 'PATCH' | 'DELETE' | 'POST',
  url: string,
  payload?: unknown,
  extra: Record<string, string> = {},
) =>
  ctx.app.inject({
    method,
    url: `/web-admin/api/v1${url}`,
    headers: { cookie: webAdmin, ...(method === 'GET' ? {} : { origin: ORIGIN.portal }), ...extra },
    ...(payload === undefined ? {} : { payload: payload as Record<string, unknown> }),
  });

async function uploadAsset(data: Buffer, name = 'banner.png') {
  const body = multipart(
    { name: 'Banner uji', kind: 'banner' },
    { field: 'file', name, type: 'image/png', data },
  );
  return ctx.app.inject({
    method: 'POST',
    url: '/web-admin/api/v1/assets',
    headers: { cookie: webAdmin, origin: ORIGIN.portal, 'content-type': body.contentType },
    payload: body.payload,
  });
}

const banner = (imageUrl: string | null) => ({
  site: 'public',
  page: 'home',
  slot: 'hero',
  title: 'Banner uji',
  subtitle: null,
  ctaLabel: 'Lihat produk',
  ctaHref: '/produk',
  imageUrl,
  startsAt: todayWib(),
  endsAt: todayWib(),
  status: 'published',
});

describe('console Administrator Web', () => {
  it('halaman bawaan terdaftar; terbitkan halaman mencatat riwayat dan audit', async () => {
    const pages = (await cms('GET', '/pages')).json().data;
    expect(pages.map((page: { slug: string }) => page.slug)).toEqual([
      'kontak',
      'tentang',
      'tentang/area',
      'tentang/kantor',
    ]);
    const target = pages[0];
    expect((await cms('PATCH', `/pages/${target.id}/status`, { status: 'draft' })).statusCode).toBe(
      204,
    );
    expect(
      (await cms('PATCH', `/pages/${target.id}/status`, { status: 'published' })).statusCode,
    ).toBe(204);
    const publications = (await cms('GET', '/publications')).json().data;
    expect(publications[0]).toMatchObject({
      objectType: 'page',
      objectTitle: 'Hubungi Kami',
      revision: 2,
    });
    const audit = (await cms('GET', '/audit')).json().data;
    expect(audit.map((event: { action: string }) => event.action)).toContain(
      'page.status.published',
    );
  });

  it('banner hanya memakai gambar dari Aset Website, lalu tayang di Publik', async () => {
    const external = await cms(
      'PUT',
      '/banners/banner-1',
      banner('https://situs-lain.test/gambar.png'),
    );
    expect(external.statusCode).toBe(422);

    const uploaded = await uploadAsset(SAMPLE_PNG);
    expect(uploaded.statusCode).toBe(201);
    const asset = uploaded.json();
    expect(asset.url).toMatch(
      /^https:\/\/agrabudi\.test\/media\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.png$/,
    );

    expect((await cms('PUT', '/banners/banner-1', banner(asset.url))).statusCode).toBe(200);
    const live = await ctx.app.inject({ method: 'GET', url: '/api/public/v1/banners?page=home' });
    expect(live.json().data).toHaveLength(1);
    expect(live.json().data[0]).toMatchObject({ id: 'banner-1', imageUrl: asset.url });

    // Aset yang masih dipakai banner tidak bisa dihapus.
    expect((await cms('DELETE', `/assets/${asset.id}`)).statusCode).toBe(409);
  });

  it('tautan tombol banner hanya path internal atau https', async () => {
    const response = await cms('PUT', '/banners/banner-2', {
      ...banner(null),
      ctaHref: 'javascript:alert(1)',
    });
    expect(response.statusCode).toBe(422);
  });

  it('SVG dan berkas bukan gambar ditolak sebagai aset', async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    );
    expect((await uploadAsset(svg, 'logo.svg')).statusCode).toBe(415);
    expect((await uploadAsset(Buffer.from('bukan gambar'), 'foto.png')).statusCode).toBe(415);
  });

  it('menu navigasi milik modul bisnis tidak bisa disembunyikan', async () => {
    await ctx.db
      .insertInto('siteNavigation')
      .values({
        id: 'nav-karir',
        site: 'public',
        label: 'Karir',
        href: '/karir',
        visible: true,
        locked: true,
        sortOrder: 0,
      })
      .execute();
    const hide = await cms('PUT', '/navigation', [
      {
        id: 'nav-karir',
        site: 'public',
        label: 'Karir',
        href: '/karir',
        visible: false,
        locked: true,
      },
    ]);
    expect(hide.statusCode).toBe(409);
    const drop = await cms('PUT', '/navigation', []);
    expect(drop.statusCode).toBe(409);
    // Mencoba membuka kunci dari browser tidak berpengaruh.
    const unlock = await cms('PUT', '/navigation', [
      {
        id: 'nav-karir',
        site: 'public',
        label: 'Lowongan',
        href: '/karir',
        visible: true,
        locked: false,
      },
    ]);
    expect(unlock.statusCode).toBe(200);
    const saved = await ctx.db.selectFrom('siteNavigation').selectAll().executeTakeFirstOrThrow();
    expect(saved).toMatchObject({ label: 'Lowongan', locked: true });
  });

  it('Admin Web tidak punya jalan ke data bisnis', async () => {
    for (const url of ['/api/v1/modules?path=/admin/abkshop-outlet/order', '/api/v1/auth/me']) {
      const response = await ctx.app.inject({ method: 'GET', url, headers: { cookie: webAdmin } });
      expect(response.statusCode).toBe(401);
    }
  });

  it('profil perusahaan divalidasi kontrak lalu tampil di Publik', async () => {
    const profile = {
      about: ['Paragraf profil.'],
      history: [],
      vision: 'Visi.',
      missions: ['Misi.'],
      areas: [],
      offices: [],
      channels: [],
    };
    expect((await cms('PUT', '/company-profile', { ...profile, vision: 123 })).statusCode).toBe(
      422,
    );
    expect((await cms('PUT', '/company-profile', profile)).statusCode).toBe(200);
    const live = await ctx.app.inject({ method: 'GET', url: '/api/public/v1/company-profile' });
    expect(live.json().data).toEqual(profile);
  });
});
