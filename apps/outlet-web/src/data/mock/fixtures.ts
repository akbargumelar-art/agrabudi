import {
  outletProfileSchema,
  programSchema,
  rewardHandoverSchema,
  siteSettingsSchema,
  type OutletProfile,
  type Program,
  type RewardHandover,
  type SiteSettings,
} from '@agrabudi/contracts';
import { handoverArt, programArt, storeArt } from '@agrabudi/ui/mock-art';

/**
 * DATA CONTOH untuk mencoba aplikasi Outlet. Outlet, program, pemenang, dan profil di
 * file ini rekaan. Gambar adalah ilustrasi, bukan foto orang atau toko sungguhan.
 * Tidak boleh dipakai sebagai data resmi atau seed produksi (PRD 1.5, 3.3).
 */

/** Alamat ini bukan rekaan: halaman pemesanan yang diminta Abay untuk disematkan. */
export const mockSiteSettings: SiteSettings = siteSettingsSchema.parse({
  abkshopEmbedUrl: 'https://order.agrabudi.com/',
});

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
