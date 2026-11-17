import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { newId } from '../src/lib/ids';
import { todayWib } from '../src/lib/http';
import {
  ORIGIN,
  SAMPLE_PDF,
  createStaff,
  createTestContext,
  idemKey,
  loginStaff,
  multipart,
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

const get = (url: string) => ctx.app.inject({ method: 'GET', url });
const shiftDays = (days: number) => {
  const date = new Date(`${todayWib()}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

describe('konten Publik hanya yang terbit', () => {
  it('produk draft tidak tampil; detail draft dijawab null', async () => {
    const base = {
      category: 'perdana' as const,
      summary: '',
      terms: '[]',
      priceRupiah: null,
      imageUrl: null,
    };
    await ctx.db
      .insertInto('customerProducts')
      .values([
        { ...base, id: newId(), slug: 'terbit', name: 'Produk Terbit', status: 'published' },
        { ...base, id: newId(), slug: 'draft', name: 'Produk Draft', status: 'draft' },
      ])
      .execute();
    const list = await get('/api/public/v1/customer-products');
    expect(list.json().data.map((item: { slug: string }) => item.slug)).toEqual(['terbit']);
    expect(list.json().meta.source).toBe('api');
    expect(list.headers['cache-control']).toBe('public, max-age=60');
    expect((await get('/api/public/v1/customer-products/draft')).json().data).toBeNull();
    // Harga belum diterbitkan tetap null, tidak diisi dari harga Outlet.
    expect(
      (await get('/api/public/v1/customer-products/terbit')).json().data.priceRupiah,
    ).toBeNull();
  });

  it('program hanya untuk audiens publik, terbit, dan belum berakhir', async () => {
    const base = { summary: '', terms: '[]', imageUrl: null, status: 'published' as const };
    await ctx.db
      .insertInto('programs')
      .values([
        {
          ...base,
          id: newId(),
          slug: 'publik',
          audience: 'public',
          title: 'Publik',
          startsAt: shiftDays(-5),
          endsAt: shiftDays(5),
        },
        {
          ...base,
          id: newId(),
          slug: 'outlet',
          audience: 'outlet',
          title: 'Outlet',
          startsAt: shiftDays(-5),
          endsAt: shiftDays(5),
        },
        {
          ...base,
          id: newId(),
          slug: 'lewat',
          audience: 'public',
          title: 'Lewat',
          startsAt: shiftDays(-30),
          endsAt: shiftDays(-1),
        },
        {
          ...base,
          id: newId(),
          slug: 'draft',
          audience: 'public',
          title: 'Draft',
          startsAt: shiftDays(-5),
          endsAt: shiftDays(5),
          status: 'draft',
        },
      ])
      .execute();
    const slugs = (await get('/api/public/v1/programs'))
      .json()
      .data.map((item: { slug: string }) => item.slug);
    expect(slugs).toEqual(['publik']);
    expect((await get('/api/public/v1/programs/outlet')).json().data).toBeNull();
    const outletList = await ctx.app.inject({ method: 'GET', url: '/api/v1/outlet/programs' });
    expect(outletList.json().data.map((item: { slug: string }) => item.slug)).toEqual(['outlet']);
  });

  it('lowongan lewat tanggal tutup dilaporkan tutup; draft tidak tampil', async () => {
    const base = {
      unit: 'Mobile',
      location: 'Cirebon',
      summary: '',
      requirements: '[]',
      employmentType: 'Kontrak',
    };
    await ctx.db
      .insertInto('vacancies')
      .values([
        {
          ...base,
          id: newId(),
          slug: 'buka',
          title: 'Buka',
          closesAt: shiftDays(10),
          status: 'open',
        },
        {
          ...base,
          id: newId(),
          slug: 'lewat',
          title: 'Lewat',
          closesAt: shiftDays(-1),
          status: 'open',
        },
        {
          ...base,
          id: newId(),
          slug: 'draft',
          title: 'Draft',
          closesAt: shiftDays(10),
          status: 'draft',
        },
      ])
      .execute();
    const list = (await get('/api/public/v1/vacancies')).json().data;
    expect(list.map((item: { slug: string; status: string }) => [item.slug, item.status])).toEqual([
      ['buka', 'open'],
      ['lewat', 'closed'],
    ]);
  });

  it('banner hanya yang terbit dan dalam periode tayang', async () => {
    const base = {
      site: 'public' as const,
      page: 'home',
      slot: 'hero',
      subtitle: null,
      ctaLabel: null,
      ctaHref: null,
      imageUrl: null,
    };
    await ctx.db
      .insertInto('siteBanners')
      .values([
        {
          ...base,
          id: 'aktif',
          title: 'Aktif',
          startsAt: shiftDays(-1),
          endsAt: shiftDays(1),
          status: 'published',
        },
        {
          ...base,
          id: 'nanti',
          title: 'Nanti',
          startsAt: shiftDays(2),
          endsAt: shiftDays(9),
          status: 'published',
        },
        {
          ...base,
          id: 'draft',
          title: 'Draft',
          startsAt: shiftDays(-1),
          endsAt: shiftDays(1),
          status: 'draft',
        },
      ])
      .execute();
    const ids = (await get('/api/public/v1/banners?page=home'))
      .json()
      .data.map((item: { id: string }) => item.id);
    expect(ids).toEqual(['aktif']);
  });

  it('profil perusahaan yang belum diisi dijawab 404, bukan isi rekaan', async () => {
    const response = await get('/api/public/v1/company-profile');
    expect(response.statusCode).toBe(404);
    expect(response.json().error).toMatchObject({
      code: 'NOT_FOUND',
      message: 'Informasi ini belum diterbitkan.',
    });
    expect(response.json().error.requestId).toBeTruthy();
  });

  it('alamat API yang tidak ada dijawab dengan bentuk error yang sama', async () => {
    const response = await get('/api/public/v1/tidak-ada');
    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('NOT_FOUND');
  });
});

describe('form publik', () => {
  const send = (path: string, payload: unknown, key: string | null = idemKey()) =>
    ctx.app.inject({
      method: 'POST',
      url: `/api/public/v1/forms/${path}`,
      headers: { origin: ORIGIN.public, ...(key ? { 'idempotency-key': key } : {}) },
      payload: payload as Record<string, unknown>,
    });

  it('nomor referensi dibuat server; kirim ulang dengan key sama tidak membuat duplikat', async () => {
    const key = idemKey();
    const payload = {
      name: 'Pengirim Uji',
      phone: '081234567890',
      topic: 'produk',
      message: 'Pesan uji yang cukup panjang.',
    };
    const first = await send('contact', payload, key);
    const second = await send('contact', payload, key);
    expect(first.statusCode).toBe(201);
    expect(first.json().reference).toMatch(/^PSN-\d{6}-[2-9A-HJ-NP-Z]{6}$/);
    expect(second.statusCode).toBe(200);
    expect(second.json().reference).toBe(first.json().reference);
    const rows = await ctx.db.selectFrom('formSubmissions').select('payload').execute();
    expect(rows).toHaveLength(1);
    // Nomor HP tersimpan sebagai teks, nol di depan tetap.
    expect(rows[0]?.payload.phone).toBe('081234567890');
  });

  it('isian salah dijawab 422 dengan pesan per kolom', async () => {
    const response = await send('indihome-interest', { name: '', phone: '12345', address: 'ok' });
    expect(response.statusCode).toBe(422);
    expect(Object.keys(response.json().error.fields).sort()).toEqual(['address', 'name', 'phone']);
  });

  it('kiriman tanpa Idempotency-Key atau tanpa Origin website Publik ditolak', async () => {
    const payload = {
      outletName: 'Outlet',
      name: 'Nama',
      phone: '081234567890',
      address: 'Jalan Uji 1',
    };
    expect((await send('digipos-registration', payload, null)).statusCode).toBe(422);
    const wrongOrigin = await ctx.app.inject({
      method: 'POST',
      url: '/api/public/v1/forms/digipos-registration',
      headers: { origin: ORIGIN.portal, 'idempotency-key': idemKey() },
      payload,
    });
    expect(wrongOrigin.statusCode).toBe(403);
  });
});

describe('lamaran dan CV privat', () => {
  async function vacancy(slug: string, status: 'open' | 'closed', closesAt = shiftDays(10)) {
    await ctx.db
      .insertInto('vacancies')
      .values({
        id: newId(),
        slug,
        title: `Posisi ${slug}`,
        unit: 'Mobile',
        location: 'Cirebon',
        summary: '',
        requirements: '[]',
        employmentType: 'Kontrak',
        closesAt,
        status,
      })
      .execute();
  }
  const fields = {
    name: 'Pelamar Uji',
    email: 'pelamar@contoh.test',
    phone: '081234567890',
    consent: 'on',
  };
  const apply = (
    slug: string,
    file: { name: string; type: string; data: Buffer } | null,
    key = idemKey(),
  ) => {
    const body = multipart(fields, file ? { field: 'cv', ...file } : undefined);
    return ctx.app.inject({
      method: 'POST',
      url: `/api/public/v1/forms/job-application/${slug}`,
      headers: { origin: ORIGIN.public, 'idempotency-key': key, 'content-type': body.contentType },
      payload: body.payload,
    });
  };

  it('lowongan tutup menolak lamaran baru', async () => {
    await vacancy('tutup', 'closed');
    await vacancy('lewat', 'open', shiftDays(-1));
    for (const slug of ['tutup', 'lewat']) {
      const response = await apply(slug, {
        name: 'cv.pdf',
        type: 'application/pdf',
        data: SAMPLE_PDF,
      });
      expect(response.statusCode).toBe(409);
      expect(response.json().error.code).toBe('VACANCY_CLOSED');
    }
  });

  it('berkas bernama .pdf yang isinya bukan PDF/Word ditolak', async () => {
    await vacancy('buka', 'open');
    const response = await apply('buka', {
      name: 'cv.pdf',
      type: 'application/pdf',
      data: Buffer.from('<script>alert(1)</script>'),
    });
    expect(response.statusCode).toBe(415);
  });

  it('CV melebihi 2 MB ditolak', async () => {
    await vacancy('buka', 'open');
    const big = Buffer.concat([SAMPLE_PDF, Buffer.alloc(2 * 1024 * 1024)]);
    expect(
      (await apply('buka', { name: 'cv.pdf', type: 'application/pdf', data: big })).statusCode,
    ).toBe(413);
  });

  it('CV hanya bisa diunduh Admin dengan izin rekrutmen', async () => {
    await vacancy('buka', 'open');
    const sent = await apply('buka', {
      name: 'cv saya.pdf',
      type: 'application/pdf',
      data: SAMPLE_PDF,
    });
    expect(sent.statusCode).toBe(201);
    const submission = await ctx.db
      .selectFrom('formSubmissions')
      .select(['id', 'cvFileKey'])
      .executeTakeFirstOrThrow();
    expect(submission.cvFileKey).toMatch(/^\d{4}\/\d{2}\/[0-9a-f-]{36}\.pdf$/);
    const url = `/api/v1/admin/applications/${submission.id}/cv`;

    await createStaff(ctx.db, {
      username: 'hr',
      role: 'admin',
      unit: 'mobile',
      permissions: ['career.manage'],
    });
    await createStaff(ctx.db, { username: 'adminbiasa', role: 'admin', unit: 'mobile' });
    await createStaff(ctx.db, { username: 'manager', role: 'manager' });
    await createStaff(ctx.db, { username: 'adminweb', role: 'web_admin' });

    const allowed = await ctx.app.inject({
      method: 'GET',
      url,
      headers: { cookie: await loginStaff(ctx.app, 'hr') },
    });
    expect(allowed.statusCode).toBe(200);
    expect(allowed.headers['content-disposition']).toMatch(/^attachment; filename="CV-LMR-/);
    expect(allowed.rawPayload.equals(SAMPLE_PDF)).toBe(true);

    for (const username of ['adminbiasa', 'manager']) {
      const denied = await ctx.app.inject({
        method: 'GET',
        url,
        headers: { cookie: await loginStaff(ctx.app, username) },
      });
      expect(denied.statusCode).toBe(403);
    }
    // Admin Web dan pengunjung tidak punya sesi staff sama sekali.
    expect(
      (
        await ctx.app.inject({
          method: 'GET',
          url,
          headers: { cookie: await loginStaff(ctx.app, 'adminweb') },
        })
      ).statusCode,
    ).toBe(401);
    expect((await ctx.app.inject({ method: 'GET', url })).statusCode).toBe(401);
  });
});
