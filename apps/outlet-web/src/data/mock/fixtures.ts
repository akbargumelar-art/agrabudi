import {
  outletCatalogSchema,
  outletOrderSchema,
  outletProfileSchema,
  programSchema,
  rewardHandoverSchema,
  type OutletCatalog,
  type OutletOrder,
  type OutletProfile,
  type Program,
  type RewardHandover,
} from '@agrabudi/contracts';
import { handoverArt, programArt, storeArt } from '@agrabudi/ui/mock-art';

/**
 * DATA CONTOH untuk mencoba aplikasi Outlet. Outlet, program, pemenang, dan profil di
 * file ini rekaan. Gambar adalah ilustrasi, bukan foto orang atau toko sungguhan.
 * Tidak boleh dipakai sebagai data resmi atau seed produksi (PRD 1.5, 3.3).
 */

/**
 * Katalog ABKShop Outlet. Nama, isi, dan harga paket rekaan.
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

const ordersContoh001: OutletOrder[] = [
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

const ordersContoh002: OutletOrder[] = [
  {
    id: 'order-contoh-3',
    number: 'CONTOH-0003',
    createdAt: '2026-11-12T02:05:00Z',
    status: 'dikonfirmasi',
    paymentStatus: 'menunggu_pembayaran',
    items: [
      {
        packageId: 'paket-contoh-d',
        nameSnapshot: 'Paket Contoh D',
        contentsSnapshot: 'Isi paket contoh: 50 unit',
        unitPriceRupiah: 1200000,
        qty: 1,
        lineTotalRupiah: 1200000,
      },
    ],
    totalRupiah: 1200000,
  },
].map((order) => outletOrderSchema.parse(order));

/**
 * Pesanan per outlet. Mock hanya membuka pesanan milik outlet yang masuk, meniru
 * server yang menyaring dari sesi (PRD 4.16: outlet A ke B ditolak).
 * CONTOH003 sengaja tanpa pesanan untuk mencoba tampilan kosong.
 */
export const mockOrdersByOutlet: Record<string, OutletOrder[]> = {
  CONTOH001: ordersContoh001,
  CONTOH002: ordersContoh002,
};

export const mockPrograms: Program[] = [
  {
    id: 'program-outlet-1',
    slug: 'target-perdana-november',
    audience: 'outlet',
    title: 'Target Perdana November',
    summary: 'Outlet yang menjual minimal 100 perdana dalam sebulan mendapat hadiah langsung.',
    terms: [
      'Penjualan dihitung dari aktivasi perdana selama 1–30 November 2026.',
      'Hadiah diserahkan salesforce paling lambat 14 hari setelah periode berakhir.',
      'Penjualan dari nomor yang sama hanya dihitung sekali.',
    ],
    startsAt: '2026-11-01',
    endsAt: '2026-11-30',
    imageUrl: programArt('target-perdana', 'red'),
    status: 'published',
  },
  {
    id: 'program-outlet-2',
    slug: 'undian-voucher-akhir-tahun',
    audience: 'outlet',
    title: 'Undian Voucher Akhir Tahun',
    summary: 'Setiap pembelian 50 voucher fisik mendapat satu kupon undian berhadiah.',
    terms: [
      'Pengundian di kantor cluster dengan saksi.',
      'Pemenang diumumkan di slider halaman Home.',
    ],
    startsAt: '2026-12-01',
    endsAt: '2026-12-31',
    imageUrl: programArt('undian-voucher', 'gold'),
    status: 'published',
  },
  {
    id: 'program-outlet-3',
    slug: 'outlet-rapi-pop',
    audience: 'outlet',
    title: 'Outlet Rapi dengan Materi Promosi',
    summary: 'Pasang materi promosi dengan rapi dan menangkan bonus saldo.',
    terms: ['Penilaian dari foto kunjungan salesforce.', 'Tiga outlet terbaik per TAP.'],
    startsAt: '2026-10-01',
    endsAt: '2026-10-31',
    imageUrl: programArt('outlet-rapi', 'ink'),
    status: 'published',
  },
].map((program) => programSchema.parse(program));

const handoverInputs: Array<Omit<RewardHandover, 'id' | 'photoUrl'>> = [
  {
    programTitle: 'Outlet Rapi dengan Materi Promosi',
    rewardName: 'Kulkas Mini',
    outletName: 'Cell Berkah Jaya',
    tap: 'TAP Kota Cirebon',
    receiverName: 'Pemilik outlet',
    handedOverAt: '2026-11-12',
  },
  {
    programTitle: 'Outlet Rapi dengan Materi Promosi',
    rewardName: 'Bonus Saldo Rp500.000',
    outletName: 'Toko Pulsa Sinar',
    tap: 'TAP Sumber',
    receiverName: 'Pemilik outlet',
    handedOverAt: '2026-11-10',
  },
  {
    programTitle: 'Target Perdana Oktober',
    rewardName: 'Smartphone',
    outletName: 'Mitra Cell 88',
    tap: 'TAP Kuningan',
    receiverName: 'Penjaga toko',
    handedOverAt: '2026-11-06',
  },
  {
    programTitle: 'Target Perdana Oktober',
    rewardName: 'Etalase Kaca',
    outletName: 'Barokah Phone',
    tap: 'TAP Sumber',
    receiverName: null,
    handedOverAt: '2026-11-04',
  },
  {
    programTitle: 'Target Perdana Oktober',
    rewardName: 'Kipas Angin',
    outletName: 'Sumber Rejeki Cell',
    tap: 'TAP Kota Cirebon',
    receiverName: 'Pemilik outlet',
    handedOverAt: '2026-11-02',
  },
  {
    programTitle: 'Undian Voucher September',
    rewardName: 'Sepeda Motor',
    outletName: 'Putra Jaya Ponsel',
    tap: 'TAP Kuningan',
    receiverName: 'Pemilik outlet',
    handedOverAt: '2026-10-20',
  },
];

export const mockHandovers: RewardHandover[] = handoverInputs.map((input, index) =>
  rewardHandoverSchema.parse({
    ...input,
    id: `serah-${index + 1}`,
    photoUrl: handoverArt(input.outletName, `serah-${index + 1}`),
  }),
);

/** Kata sandi semua akun outlet contoh. Hanya berlaku di mock. */
export const DEMO_OUTLET_PASSWORD = 'contoh123';

export const mockOutletProfiles: OutletProfile[] = [
  {
    digiposId: 'CONTOH001',
    outletName: 'Cell Berkah Jaya',
    ownerName: 'Hendra Wijaya',
    tap: 'TAP Kota Cirebon',
    phone: '081200000001',
    address: 'Jl. Contoh No. 10, Kejaksan, Kota Cirebon',
    district: 'Kejaksan',
    salesforceName: 'Rizky Pratama',
    registeredAt: '2024-03-12',
    photoUrl: storeArt('Cell Berkah Jaya', 'CONTOH001'),
    programs: [
      {
        programTitle: 'Target Perdana November',
        progress: '64 dari 100 perdana',
        status: 'berjalan',
      },
      {
        programTitle: 'Outlet Rapi dengan Materi Promosi',
        progress: 'Juara 1 TAP Kota Cirebon',
        status: 'tercapai',
      },
    ],
  },
  {
    digiposId: 'CONTOH002',
    outletName: 'Toko Pulsa Sinar',
    ownerName: 'Siti Rahmawati',
    tap: 'TAP Sumber',
    phone: '081200000002',
    address: 'Jl. Contoh No. 21, Sumber, Kabupaten Cirebon',
    district: 'Sumber',
    salesforceName: 'Dimas Saputra',
    registeredAt: '2023-08-01',
    photoUrl: storeArt('Toko Pulsa Sinar', 'CONTOH002'),
    programs: [
      {
        programTitle: 'Target Perdana November',
        progress: '102 dari 100 perdana',
        status: 'tercapai',
      },
    ],
  },
  {
    digiposId: 'CONTOH003',
    outletName: 'Mitra Cell 88',
    ownerName: 'Agus Setiawan',
    tap: 'TAP Kuningan',
    phone: '081200000003',
    address: 'Jl. Contoh No. 3, Cilimus, Kabupaten Kuningan',
    district: 'Cilimus',
    salesforceName: 'Fajar Nugroho',
    registeredAt: '2025-01-20',
    photoUrl: storeArt('Mitra Cell 88', 'CONTOH003'),
    programs: [
      {
        programTitle: 'Target Perdana November',
        progress: '18 dari 100 perdana',
        status: 'berjalan',
      },
      {
        programTitle: 'Outlet Rapi dengan Materi Promosi',
        progress: 'Belum masuk tiga besar',
        status: 'tidak_tercapai',
      },
    ],
  },
].map((profile) => outletProfileSchema.parse(profile));
