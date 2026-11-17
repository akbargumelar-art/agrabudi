import type { ModuleDataset } from '@agrabudi/contracts';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { todayWib } from '../src/lib/http';
import {
  ORIGIN,
  createStaff,
  createTestContext,
  loginStaff,
  resetDatabase,
  type TestContext,
} from './helpers';

let ctx: TestContext;
let adminMobile: string;

beforeAll(async () => {
  ctx = await createTestContext();
});
afterAll(async () => ctx.close());
beforeEach(async () => {
  await resetDatabase(ctx.db);
  await createStaff(ctx.db, {
    username: 'adminmobile',
    role: 'admin',
    unit: 'mobile',
    permissions: ['career.manage'],
  });
  adminMobile = await loginStaff(ctx.app, 'adminmobile');
});

const dataset = async (cookie: string, path: string) =>
  ctx.app.inject({
    method: 'GET',
    url: `/api/v1/modules?path=${encodeURIComponent(path)}`,
    headers: { cookie },
  });
const save = (
  cookie: string,
  path: string,
  body: { id?: string; cells: Record<string, string | number | null> },
) =>
  ctx.app.inject({
    method: 'POST',
    url: `/api/v1/modules/rows?path=${encodeURIComponent(path)}`,
    headers: { cookie, origin: ORIGIN.portal },
    payload: body,
  });

describe('akses modul Portal di server', () => {
  it('menu yang belum tersambung dijawab 404 dengan alasan, bukan data contoh', async () => {
    const response = await dataset(adminMobile, '/telkomsel/sales-plan');
    expect(response.statusCode).toBe(404);
    expect(response.json().error.message).toMatch(/belum tersambung/);
  });

  it('peran tanpa izin ditolak 403 walau memanggil API langsung', async () => {
    await createStaff(ctx.db, {
      username: 'sfmobile',
      role: 'salesforce',
      unit: 'mobile',
      scope: 'self',
    });
    await createStaff(ctx.db, { username: 'adminhousehold', role: 'admin', unit: 'household' });
    await createStaff(ctx.db, { username: 'adminnohr', role: 'admin', unit: 'mobile' });
    const sf = await loginStaff(ctx.app, 'sfmobile');
    const household = await loginStaff(ctx.app, 'adminhousehold');
    const noHr = await loginStaff(ctx.app, 'adminnohr');
    expect((await dataset(sf, '/admin/abkshop-outlet/paket')).statusCode).toBe(403);
    expect((await dataset(household, '/admin/abkshop-outlet/paket')).statusCode).toBe(403);
    expect((await dataset(household, '/admin/indihome/paket-layanan')).statusCode).toBe(200);
    // Lowongan butuh izin career.manage, tidak cukup unit.
    expect((await dataset(noHr, '/admin/kelola-karir/lowongan')).statusCode).toBe(403);
    expect((await save(noHr, '/admin/kelola-karir/lowongan', { cells: {} })).statusCode).toBe(403);
  });
});

describe('alur data Admin ke Publik', () => {
  it('lowongan draft tidak tampil di Publik; setelah Dibuka langsung tampil', async () => {
    const path = '/admin/kelola-karir/lowongan';
    const cells = {
      judul: 'Salesforce Mobile',
      unit: 'Mobile',
      lokasi: 'Cirebon',
      jenis: 'Kontrak',
      ditutup: todayWib(),
      ringkasan: 'Ringkasan lowongan uji.',
      syarat: '- Syarat satu\n- Syarat dua',
      status: 'Draft',
    };
    const created = await save(adminMobile, path, { cells });
    expect(created.statusCode).toBe(201);
    const { id } = created.json();
    expect(
      (await ctx.app.inject({ method: 'GET', url: '/api/public/v1/vacancies' })).json().data,
    ).toEqual([]);

    expect(
      (await save(adminMobile, path, { id, cells: { ...cells, status: 'Dibuka' } })).statusCode,
    ).toBe(200);
    const list = (await ctx.app.inject({ method: 'GET', url: '/api/public/v1/vacancies' })).json()
      .data;
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      slug: 'salesforce-mobile',
      status: 'open',
      requirements: ['Syarat satu', 'Syarat dua'],
    });

    const body: ModuleDataset = (await dataset(adminMobile, path)).json().data;
    expect(body.rows[0]?.cells).toMatchObject({
      judul: 'Salesforce Mobile',
      status: 'Dibuka',
      pelamar: 0,
    });
  });

  it('isian salah dijawab per kolom dan tidak ada yang tersimpan', async () => {
    const response = await save(adminMobile, '/admin/abkshop-outlet/paket', {
      cells: {
        paket: '',
        kategori: 'Tidak ada',
        isi: 'x',
        harga: '12.500',
        minimum: '0',
        kelipatan: '1',
        maksimum: '',
        status: 'Terbit',
      },
    });
    expect(response.statusCode).toBe(422);
    expect(Object.keys(response.json().error.fields).sort()).toEqual([
      'harga',
      'kategori',
      'minimum',
      'paket',
    ]);
    expect(await ctx.db.selectFrom('outletPackages').selectAll().execute()).toEqual([]);
  });

  it('ubah harga paket Outlet menaikkan versi harga; katalog Pelanggan tidak ikut berubah', async () => {
    await save(adminMobile, '/admin/abkshop-outlet/kategori', {
      cells: { kategori: 'Perdana', urutan: 1 },
    });
    const paket = {
      paket: 'Paket Uji',
      kategori: 'Perdana',
      deskripsi: '',
      isi: '10 perdana',
      harga: 420000,
      minimum: 1,
      maksimum: null,
      kelipatan: 1,
      status: 'Terbit',
    };
    const { id } = (
      await save(adminMobile, '/admin/abkshop-outlet/paket', { cells: paket })
    ).json();
    await save(adminMobile, '/admin/abkshop-pelanggan/produk', {
      cells: {
        nama: 'Paket Uji',
        kategori: 'Perdana',
        ringkasan: '',
        ketentuan: '',
        harga: null,
        status: 'Terbit',
      },
    });

    await save(adminMobile, '/admin/abkshop-outlet/paket', {
      id,
      cells: { ...paket, deskripsi: 'Hanya teks berubah' },
    });
    expect(
      (await ctx.db.selectFrom('outletPackages').select('priceVersion').executeTakeFirstOrThrow())
        .priceVersion,
    ).toBe(1);
    await save(adminMobile, '/admin/abkshop-outlet/paket', {
      id,
      cells: { ...paket, harga: 430000 },
    });
    expect(
      (await ctx.db.selectFrom('outletPackages').select('priceVersion').executeTakeFirstOrThrow())
        .priceVersion,
    ).toBe(2);

    const customer = (
      await ctx.app.inject({ method: 'GET', url: '/api/public/v1/customer-products' })
    ).json().data;
    expect(customer[0].priceRupiah).toBeNull();
  });

  it('paket Outlet tidak bisa dihapus dari Portal, hanya diarsipkan', async () => {
    const response = await ctx.app.inject({
      method: 'DELETE',
      url: `/api/v1/modules/rows/apa-saja?path=${encodeURIComponent('/admin/abkshop-outlet/paket')}`,
      headers: { cookie: adminMobile, origin: ORIGIN.portal },
    });
    expect(response.statusCode).toBe(403);
    const body: ModuleDataset = (await dataset(adminMobile, '/admin/abkshop-outlet/paket')).json()
      .data;
    expect(body).toMatchObject({ canCreate: true, canDelete: false });
  });

  it('lead hanya masuk dari form, tidak bisa dibuat dari Portal', async () => {
    await createStaff(ctx.db, { username: 'adminhousehold', role: 'admin', unit: 'household' });
    const household = await loginStaff(ctx.app, 'adminhousehold');
    const response = await save(household, '/admin/indihome/lead', { cells: { status: 'Baru' } });
    expect(response.statusCode).toBe(403);
  });
});
