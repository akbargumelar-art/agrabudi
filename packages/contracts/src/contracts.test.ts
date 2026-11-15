import { describe, expect, it } from 'vitest';
import {
  appUrlsSchema,
  customerProductSchema,
  dataMetaSchema,
  outletOrderSchema,
  outletPackageSchema,
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
});
