import { describe, expect, it } from 'vitest';
import {
  appUrlsSchema,
  customerProductSchema,
  dataMetaSchema,
  outletOrderSchema,
  outletPackageSchema,
  siteSettingsSchema,
  staffProfileUpdateSchema,
} from './index';

describe('kontrak data', () => {
  it('menolak harga pecahan dan negatif', () => {
    const base = {
      id: 'pkg-1',
      channel: 'outlet',
      name: 'Paket Contoh',
      description: '',
      contents: '',
      categoryId: 'cat-1',
      minQty: 1,
      maxQty: null,
      multipleOf: 1,
      thumbnailUrl: null,
    };
    expect(outletPackageSchema.safeParse({ ...base, unitPriceRupiah: 420000 }).success).toBe(true);
    expect(outletPackageSchema.safeParse({ ...base, unitPriceRupiah: 420000.5 }).success).toBe(
      false,
    );
    expect(outletPackageSchema.safeParse({ ...base, unitPriceRupiah: -1 }).success).toBe(false);
  });

  it('menolak kanal yang salah pada tiap katalog', () => {
    const product = {
      id: 'p-1',
      slug: 'produk-contoh',
      channel: 'outlet',
      name: 'Produk Contoh',
      category: 'perdana',
      summary: '',
      terms: [],
      priceRupiah: null,
      imageUrl: null,
      status: 'published',
    };
    expect(customerProductSchema.safeParse(product).success).toBe(false);
    expect(customerProductSchema.safeParse({ ...product, channel: 'customer' }).success).toBe(true);
  });

  it('memisahkan status order dan status pembayaran', () => {
    const order = {
      id: 'o-1',
      number: 'CONTOH-0001',
      createdAt: '2026-11-01T02:00:00Z',
      status: 'diajukan',
      paymentStatus: 'belum_ditagih',
      items: [
        {
          packageId: 'pkg-1',
          nameSnapshot: 'Paket Contoh',
          contentsSnapshot: '',
          unitPriceRupiah: 420000,
          qty: 2,
          lineTotalRupiah: 840000,
        },
      ],
      totalRupiah: 840000,
    };
    expect(outletOrderSchema.safeParse(order).success).toBe(true);
    expect(outletOrderSchema.safeParse({ ...order, status: 'dibayar' }).success).toBe(false);
  });

  it('mewajibkan sumber data dan URL aplikasi yang sah', () => {
    expect(dataMetaSchema.safeParse({ source: 'demo', asOf: '2026-11-01T00:00:00Z' }).success).toBe(
      false,
    );
    expect(
      appUrlsSchema.safeParse({
        public: 'bukan-url',
        outlet: 'http://a.test',
        portal: 'http://b.test',
      }).success,
    ).toBe(false);
  });

  it('alamat embed ABKShop hanya menerima https di domain Agrabudi', () => {
    const ok = (url: string) => siteSettingsSchema.safeParse({ abkshopEmbedUrl: url }).success;
    expect(ok('https://order.agrabudi.com/')).toBe(true);
    expect(ok('https://outlet.agrabudi.id/pesan')).toBe(true);
    expect(ok('http://order.agrabudi.com/')).toBe(false);
    expect(ok('https://order.agrabudi.com.penipu.example/')).toBe(false);
    expect(ok('https://bukanagrabudi.com/')).toBe(false);
    expect(ok('javascript:alert(1)')).toBe(false);
  });

  it('profil: nama wajib, nomor HP tetap teks, username tidak ikut diubah', () => {
    const base = { displayName: 'Nama Contoh', email: null, phone: '081200000000' };
    expect(staffProfileUpdateSchema.safeParse(base).success).toBe(true);
    expect(staffProfileUpdateSchema.safeParse({ ...base, displayName: '   ' }).success).toBe(false);
    expect(staffProfileUpdateSchema.safeParse({ ...base, phone: '0812-abc' }).success).toBe(false);
    expect(staffProfileUpdateSchema.safeParse({ ...base, email: 'bukan-email' }).success).toBe(
      false,
    );
    const parsed = staffProfileUpdateSchema.parse({ ...base, username: 'ganti' });
    expect('username' in parsed).toBe(false);
  });
});
