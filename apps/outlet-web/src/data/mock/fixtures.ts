import {
  outletCatalogSchema,
  outletOrderSchema,
  programSchema,
  rewardHandoverSchema,
  type OutletCatalog,
  type OutletOrder,
  type Program,
  type RewardHandover,
} from '@agrabudi/contracts';

/**
 * DATA CONTOH. Nama, isi paket, harga, order, dan program di file ini rekaan
 * untuk kerangka tampilan M1. Tidak boleh dipakai sebagai data resmi dan tidak
 * boleh dipindahkan ke seed produksi (PRD 1.5, 3.3).
 *
 * Harga Rp420.000 dan Rp725.000 adalah fixture uji hitung dari PRD US-05.
 */
export const mockCatalog: OutletCatalog = outletCatalogSchema.parse({
  categories: [
    { id: 'kategori-contoh-1', name: 'Kategori Contoh 1' },
    { id: 'kategori-contoh-2', name: 'Kategori Contoh 2' },
  ],
  packages: [
    {
      id: 'paket-contoh-a',
      channel: 'outlet',
      name: 'Paket Contoh A',
      description: 'Deskripsi contoh untuk paket A.',
      contents: 'Isi paket contoh: 10 unit',
      categoryId: 'kategori-contoh-1',
      unitPriceRupiah: 420000,
      minQty: 1,
      maxQty: 50,
      multipleOf: 1,
      thumbnailUrl: null,
    },
    {
      id: 'paket-contoh-b',
      channel: 'outlet',
      name: 'Paket Contoh B',
      description: 'Deskripsi contoh untuk paket B.',
      contents: 'Isi paket contoh: 25 unit',
      categoryId: 'kategori-contoh-1',
      unitPriceRupiah: 725000,
      minQty: 1,
      maxQty: 20,
      multipleOf: 1,
      thumbnailUrl: null,
    },
    {
      id: 'paket-contoh-c',
      channel: 'outlet',
      name: 'Paket Contoh C',
      description: 'Contoh paket dengan minimum pembelian 2 dan kelipatan 2.',
      contents: 'Isi paket contoh: 5 unit',
      categoryId: 'kategori-contoh-2',
      unitPriceRupiah: 150000,
      minQty: 2,
      maxQty: null,
      multipleOf: 2,
      thumbnailUrl: null,
    },
    {
      id: 'paket-contoh-d',
      channel: 'outlet',
      name: 'Paket Contoh D',
      description: 'Contoh paket dengan batas maksimal 5.',
      contents: 'Isi paket contoh: 50 unit',
      categoryId: 'kategori-contoh-2',
      unitPriceRupiah: 1200000,
      minQty: 1,
      maxQty: 5,
      multipleOf: 1,
      thumbnailUrl: null,
    },
  ],
});

export const mockOrders: OutletOrder[] = [
  {
    id: 'order-contoh-2',
    number: 'CONTOH-0002',
    createdAt: '2026-11-10T03:15:00Z',
    status: 'diajukan',
    paymentStatus: 'belum_ditagih',
    items: [
      {
        packageId: 'paket-contoh-a',
        nameSnapshot: 'Paket Contoh A',
        contentsSnapshot: 'Isi paket contoh: 10 unit',
        unitPriceRupiah: 420000,
        qty: 2,
        lineTotalRupiah: 840000,
      },
      {
        packageId: 'paket-contoh-b',
        nameSnapshot: 'Paket Contoh B',
        contentsSnapshot: 'Isi paket contoh: 25 unit',
        unitPriceRupiah: 725000,
        qty: 1,
        lineTotalRupiah: 725000,
      },
    ],
    totalRupiah: 1565000,
  },
  {
    id: 'order-contoh-1',
    number: 'CONTOH-0001',
    createdAt: '2026-11-03T07:40:00Z',
    status: 'selesai',
    paymentStatus: 'dibayar',
    items: [
      {
        packageId: 'paket-contoh-c',
        nameSnapshot: 'Paket Contoh C',
        contentsSnapshot: 'Isi paket contoh: 5 unit',
        unitPriceRupiah: 150000,
        qty: 4,
        lineTotalRupiah: 600000,
      },
    ],
    totalRupiah: 600000,
  },
].map((order) => outletOrderSchema.parse(order));

export const mockPrograms: Program[] = [
  {
    id: 'program-outlet-contoh-1',
    slug: 'program-mitra-contoh-1',
    audience: 'outlet',
    title: 'Program Mitra Contoh 1',
    summary: 'Ringkasan contoh. Syarat dan benefit resmi diisi Admin program.',
    terms: ['Syarat contoh pertama.', 'Syarat contoh kedua.'],
    startsAt: '2026-11-01',
    endsAt: '2026-11-30',
    status: 'published',
  },
  {
    id: 'program-outlet-contoh-2',
    slug: 'program-mitra-contoh-2',
    audience: 'outlet',
    title: 'Program Mitra Contoh 2',
    summary: 'Ringkasan contoh kedua.',
    terms: ['Syarat contoh.'],
    startsAt: '2026-12-01',
    endsAt: '2026-12-31',
    status: 'published',
  },
].map((program) => programSchema.parse(program));

/** Nama outlet, hadiah, dan tanggal rekaan. Foto sengaja kosong: tidak ada foto orang sungguhan di data contoh. */
export const mockHandovers: RewardHandover[] = [
  {
    id: 'serah-contoh-5',
    programTitle: 'Program Mitra Contoh 1',
    rewardName: 'Hadiah Contoh A',
    outletName: 'Outlet Contoh Lima',
    tap: 'TAP Contoh 1',
    receiverName: 'Penerima Contoh',
    handedOverAt: '2026-11-12',
    photoUrl: null,
  },
  {
    id: 'serah-contoh-4',
    programTitle: 'Program Mitra Contoh 1',
    rewardName: 'Hadiah Contoh B',
    outletName: 'Outlet Contoh Empat',
    tap: 'TAP Contoh 2',
    receiverName: null,
    handedOverAt: '2026-11-09',
    photoUrl: null,
  },
  {
    id: 'serah-contoh-3',
    programTitle: 'Program Mitra Contoh 2',
    rewardName: 'Hadiah Contoh A',
    outletName: 'Outlet Contoh Tiga',
    tap: null,
    receiverName: 'Penerima Contoh',
    handedOverAt: '2026-11-05',
    photoUrl: null,
  },
  {
    id: 'serah-contoh-2',
    programTitle: 'Program Mitra Contoh 2',
    rewardName: 'Hadiah Contoh C',
    outletName: 'Outlet Contoh Dua',
    tap: 'TAP Contoh 1',
    receiverName: 'Penerima Contoh',
    handedOverAt: '2026-10-28',
    photoUrl: null,
  },
  {
    id: 'serah-contoh-1',
    programTitle: 'Program Mitra Contoh 1',
    rewardName: 'Hadiah Contoh B',
    outletName: 'Outlet Contoh Satu',
    tap: 'TAP Contoh 3',
    receiverName: null,
    handedOverAt: '2026-10-20',
    photoUrl: null,
  },
].map((handover) => rewardHandoverSchema.parse(handover));
