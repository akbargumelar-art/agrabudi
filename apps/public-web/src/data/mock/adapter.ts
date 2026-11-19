import {
  companyProfileSchema,
  customerProductSchema,
  digiposInfoSchema,
  indihomeInfoSchema,
  indihomePackageSchema,
  programSchema,
  siteBannerSchema,
  vacancySchema,
  type CompanyProfile,
  type CustomerProduct,
  type DataEnvelope,
  type DigiposInfo,
  type IndihomeInfo,
  type IndihomePackage,
  type Program,
  type SiteBanner,
  type Vacancy,
} from '@agrabudi/contracts';
import {
  bannerArt,
  homeInternetArt,
  officeArt,
  productArt,
  programArt,
} from '@agrabudi/ui/mock-art';
import type { PublicDataAdapter } from '../adapter';

/**
 * DATA CONTOH untuk mencoba website Publik. Nama produk, harga, program, lowongan,
 * alamat, dan kontak di bawah rekaan. Bukan data resmi dan tidak boleh dipakai sebagai
 * seed produksi (PRD 1.5, 3.3). Gambar adalah ilustrasi, bukan foto produk.
 */
type ProductInput = Omit<CustomerProduct, 'id' | 'channel' | 'imageUrl' | 'status'>;

const productInputs: ProductInput[] = [
  {
    slug: 'perdana-internet-15gb',
    name: 'Perdana Internet 15GB',
    category: 'perdana',
    summary: 'Kartu perdana dengan kuota internet 15GB untuk 30 hari.',
    terms: [
      'Kuota berlaku 30 hari sejak aktivasi.',
      'Aktivasi wajib registrasi NIK dan KK.',
      'Berlaku di seluruh jaringan nasional.',
    ],
    priceRupiah: 35000,
  },
  {
    slug: 'perdana-internet-30gb',
    name: 'Perdana Internet 30GB',
    category: 'perdana',
    summary: 'Kartu perdana 30GB dengan bonus kuota malam.',
    terms: ['Kuota utama 30GB, bonus malam 10GB.', 'Masa aktif 30 hari.'],
    priceRupiah: 60000,
  },
  {
    slug: 'perdana-nelpon-sepuasnya',
    name: 'Perdana Nelpon Sepuasnya',
    category: 'perdana',
    summary: 'Kartu perdana untuk telepon ke sesama operator.',
    terms: ['Harga belum diterbitkan; tanyakan ke outlet terdekat.'],
    priceRupiah: null,
  },
  {
    slug: 'voucher-data-10gb',
    name: 'Voucher Data 10GB',
    category: 'voucher',
    summary: 'Voucher fisik kuota 10GB, tinggal gosok dan isi ulang.',
    terms: ['Isi ulang lewat kode di balik voucher.', 'Masa berlaku kode 90 hari.'],
    priceRupiah: 30000,
  },
  {
    slug: 'voucher-data-25gb',
    name: 'Voucher Data 25GB',
    category: 'voucher',
    summary: 'Voucher fisik kuota 25GB untuk 30 hari.',
    terms: ['Isi ulang lewat kode di balik voucher.'],
    priceRupiah: 55000,
  },
  {
    slug: 'modem-orbit-4g',
    name: 'Modem Orbit 4G',
    category: 'orbit',
    summary: 'Modem WiFi rumah tanpa kabel, cukup colok listrik.',
    terms: ['Termasuk kuota awal 50GB.', 'Garansi perangkat 1 tahun.'],
    priceRupiah: 599000,
  },
  {
    slug: 'modem-orbit-pro',
    name: 'Modem Orbit Pro',
    category: 'orbit',
    summary: 'Modem WiFi untuk banyak perangkat sekaligus.',
    terms: ['Harga belum diterbitkan.'],
    priceRupiah: null,
  },
  {
    slug: 'soundbox-qris',
    name: 'Soundbox QRIS',
    category: 'soundbox',
    summary: 'Pengeras suara notifikasi pembayaran QRIS untuk toko.',
    terms: ['Termasuk stiker QRIS.', 'Notifikasi suara berbahasa Indonesia.'],
    priceRupiah: 249000,
  },
];

const products: CustomerProduct[] = productInputs.map((input, index) =>
  customerProductSchema.parse({
    ...input,
    id: `produk-${index + 1}`,
    channel: 'customer',
    imageUrl: productArt(input.category, input.name, input.slug),
    status: 'published',
  }),
);

const programs: Program[] = [
  {
    id: 'program-publik-1',
    slug: 'bonus-kuota-perdana-baru',
    audience: 'public',
    title: 'Bonus Kuota untuk Perdana Baru',
    summary: 'Aktifkan perdana baru di outlet mitra dan dapatkan bonus kuota 5GB.',
    terms: [
      'Berlaku untuk perdana yang diaktifkan selama periode program.',
      'Bonus masuk paling lambat 1x24 jam setelah aktivasi.',
      'Satu nomor hanya mendapat satu kali bonus.',
    ],
    startsAt: '2026-11-01',
    endsAt: '2026-11-30',
    imageUrl: programArt('bonus-kuota', 'red'),
    status: 'published',
  },
  {
    id: 'program-publik-2',
    slug: 'diskon-pasang-indihome',
    audience: 'public',
    title: 'Diskon Biaya Pasang IndiHome',
    summary: 'Potongan biaya pasang untuk pendaftar baru di area layanan.',
    terms: ['Berlaku di area yang sudah tercakup jaringan.', 'Kuota pemasangan terbatas.'],
    startsAt: '2026-11-15',
    endsAt: '2026-12-31',
    imageUrl: programArt('diskon-indihome', 'gold'),
    status: 'published',
  },
  {
    id: 'program-publik-3',
    slug: 'undian-isi-ulang-akhir-tahun',
    audience: 'public',
    title: 'Undian Isi Ulang Akhir Tahun',
    summary: 'Setiap isi ulang voucher di outlet mitra mendapat satu kupon undian.',
    terms: [
      'Pengundian dilakukan di kantor cluster dengan saksi.',
      'Pemenang diumumkan di website ini.',
    ],
    startsAt: '2026-12-01',
    endsAt: '2026-12-31',
    imageUrl: programArt('undian-akhir-tahun', 'ink'),
    status: 'published',
  },
].map((program) => programSchema.parse(program));

const vacancies: Vacancy[] = [
  {
    id: 'lowongan-1',
    slug: 'salesforce-mobile-kota-cirebon',
    title: 'Salesforce Mobile',
    unit: 'Mobile',
    location: 'Kota Cirebon',
    employmentType: 'Kontrak',
    summary: 'Mengunjungi outlet, menawarkan produk, dan mencatat penjualan harian.',
    requirements: [
      'Pendidikan minimal SMA/SMK.',
      'Memiliki sepeda motor dan SIM C.',
      'Terbiasa memakai aplikasi di HP.',
    ],
    closesAt: '2026-12-15',
    status: 'open',
  },
  {
    id: 'lowongan-2',
    slug: 'sales-indihome-kuningan',
    title: 'Sales IndiHome',
    unit: 'Household',
    location: 'Kabupaten Kuningan',
    employmentType: 'Kontrak',
    summary: 'Menawarkan layanan IndiHome dari rumah ke rumah dan di booth.',
    requirements: ['Pendidikan minimal SMA/SMK.', 'Komunikatif dan mau bekerja di lapangan.'],
    closesAt: '2026-12-20',
    status: 'open',
  },
  {
    id: 'lowongan-3',
    slug: 'admin-data-cirebon',
    title: 'Admin Data',
    unit: 'Support',
    location: 'Kota Cirebon',
    employmentType: 'Penuh waktu',
    summary: 'Mengolah data penjualan dan menyiapkan laporan harian.',
    requirements: ['Pendidikan minimal D3.', 'Mahir Excel (VLOOKUP, pivot).', 'Teliti dan rapi.'],
    closesAt: '2026-12-31',
    status: 'open',
  },
  {
    id: 'lowongan-4',
    slug: 'supervisor-direct-sales',
    title: 'Supervisor Direct Sales',
    unit: 'Direct Sales',
    location: 'Kabupaten Cirebon',
    employmentType: 'Penuh waktu',
    summary: 'Memimpin tim penjualan langsung di event, sekolah, dan komunitas.',
    requirements: ['Pengalaman memimpin tim penjualan minimal 2 tahun.'],
    closesAt: '2026-10-31',
    status: 'closed',
  },
].map((vacancy) => vacancySchema.parse(vacancy));

const indihomePackages: IndihomePackage[] = [
  {
    id: 'indihome-1',
    name: 'IndiHome 30 Mbps',
    summary: 'Untuk keluarga kecil: belajar online dan streaming ringan.',
    monthlyPriceRupiah: 280000,
    features: ['Internet 30 Mbps', 'Telepon rumah', 'Cocok 3-5 perangkat'],
    imageUrl: homeInternetArt('indihome-30'),
  },
  {
    id: 'indihome-2',
    name: 'IndiHome 50 Mbps',
    summary: 'Untuk kerja dari rumah dan streaming di beberapa perangkat.',
    monthlyPriceRupiah: 350000,
    features: ['Internet 50 Mbps', 'Telepon rumah', 'Cocok 5-8 perangkat'],
    imageUrl: homeInternetArt('indihome-50'),
  },
  {
    id: 'indihome-3',
    name: 'IndiHome 100 Mbps + TV',
    summary: 'Internet cepat dengan layanan TV interaktif.',
    monthlyPriceRupiah: null,
    features: ['Internet 100 Mbps', 'TV interaktif', 'Telepon rumah'],
    imageUrl: homeInternetArt('indihome-100'),
  },
].map((item) => indihomePackageSchema.parse(item));

const banners: SiteBanner[] = [
  {
    id: 'banner-1',
    site: 'public',
    page: 'home',
    slot: 'hero',
    title: 'Kuota bonus untuk setiap perdana baru',
    subtitle: 'Aktifkan perdana di outlet mitra Agrabudi selama November.',
    ctaLabel: 'Lihat promo',
    ctaHref: '/promo/bonus-kuota-perdana-baru',
    imageUrl: bannerArt('banner-1', 'ink'),
    startsAt: '2026-11-01',
    endsAt: '2026-11-30',
    status: 'published',
  },
  {
    id: 'banner-2',
    site: 'public',
    page: 'home',
    slot: 'hero',
    title: 'Pasang IndiHome, biaya pasang lebih ringan',
    subtitle: 'Daftarkan minat pemasangan, petugas kami yang menghubungi.',
    ctaLabel: 'Daftar minat',
    ctaHref: '/indihome',
    imageUrl: bannerArt('banner-2', 'gold'),
    startsAt: '2026-11-15',
    endsAt: '2026-12-31',
    status: 'published',
  },
].map((banner) => siteBannerSchema.parse(banner));

const company: CompanyProfile = companyProfileSchema.parse({
  about: [
    'PT Agrabudi Komunika adalah mitra distribusi Telkomsel dan agen layanan IndiHome. Teks ini contoh; isi resminya diisi Admin Web.',
    'Kami melayani pelanggan, mitra outlet, dan komunitas melalui tim penjualan, outlet mitra, dan kantor cluster.',
  ],
  history: [
    'Contoh paragraf sejarah perusahaan: kapan berdiri, kapan mulai bermitra, dan tonggak penting.',
    'Contoh paragraf kedua: perluasan wilayah layanan dan pembukaan kantor perwakilan.',
  ],
  vision: 'Contoh visi: menjadi mitra distribusi yang paling dekat dengan pelanggan di wilayahnya.',
  missions: [
    'Contoh misi: memastikan produk tersedia di outlet terdekat.',
    'Contoh misi: melayani pemasangan IndiHome dengan cepat dan rapi.',
    'Contoh misi: membina outlet mitra agar tumbuh bersama.',
  ],
  areas: [
    {
      name: 'Kota Cirebon',
      districts: ['Kejaksan', 'Kesambi', 'Lemahwungkuk', 'Pekalipan', 'Harjamukti'],
      // Titik perkiraan pusat kota, data contoh. Titik resmi diisi Admin Web.
      latitude: -6.732,
      longitude: 108.5523,
    },
    {
      name: 'Kabupaten Cirebon',
      districts: ['Sumber', 'Plered', 'Weru', 'Arjawinangun', 'Lemahabang', 'Palimanan'],
    },
    {
      name: 'Kabupaten Kuningan',
      districts: ['Kuningan', 'Cilimus', 'Kadugede', 'Luragung', 'Ciawigebang'],
    },
  ],
  offices: [
    {
      id: 'kantor-1',
      name: 'Kantor Cluster Cirebon Raya',
      address: 'Jl. Contoh Raya No. 1, Kota Cirebon (alamat contoh)',
      hours: 'Senin–Jumat 08.00–16.00 WIB, Sabtu 08.00–12.00 WIB',
      phone: '(0231) 000-0000',
      imageUrl: officeArt('Kantor Cirebon Raya', 'kantor-1'),
    },
    {
      id: 'kantor-2',
      name: 'Kantor Perwakilan Kuningan',
      address: 'Jl. Contoh No. 2, Kuningan (alamat contoh)',
      hours: 'Senin–Jumat 08.00–16.00 WIB',
      phone: '(0232) 000-0000',
      imageUrl: officeArt('Perwakilan Kuningan', 'kantor-2'),
    },
  ],
  channels: [
    { kind: 'whatsapp', label: 'WhatsApp layanan', value: '0800-0000-0000 (contoh)' },
    { kind: 'phone', label: 'Telepon kantor', value: '(0231) 000-0000 (contoh)' },
    { kind: 'email', label: 'Email', value: 'kontak@contoh.invalid' },
    { kind: 'instagram', label: 'Instagram', value: '@akun.contoh' },
  ],
});

const indihomeInfo: IndihomeInfo = indihomeInfoSchema.parse({
  requirements: [
    'Fotokopi KTP pemohon sesuai alamat pemasangan.',
    'Alamat berada di area yang sudah tercakup jaringan.',
    'Nomor HP aktif untuk konfirmasi jadwal.',
  ],
  faqs: [
    {
      question: 'Berapa lama pemasangan setelah mendaftar?',
      answer:
        'Contoh jawaban: petugas menghubungi Anda dalam 1x24 jam untuk mengatur jadwal survei.',
    },
    {
      question: 'Bagaimana tahu alamat saya sudah tercakup jaringan?',
      answer:
        'Contoh jawaban: kirim form minat, petugas akan mengecek ketersediaan jaringan di alamat Anda.',
    },
    {
      question: 'Apakah bisa pindah paket setelah terpasang?',
      answer: 'Contoh jawaban: bisa, ajukan lewat kanal resmi di halaman Hubungi Kami.',
    },
  ],
});

const digiposInfo: DigiposInfo = digiposInfoSchema.parse({
  requirements: [
    'Memiliki toko atau tempat usaha tetap.',
    'KTP pemilik dan foto tampak depan toko.',
    'Nomor HP aktif untuk akun Digipos.',
  ],
  steps: [
    'Isi form pendaftaran di halaman ini.',
    'Simpan nomor referensi yang muncul setelah form terkirim.',
    'Petugas menghubungi Anda untuk verifikasi dan kunjungan toko.',
    'Akun Digipos aktif setelah verifikasi selesai.',
  ],
});

function asMock<T>(data: T): DataEnvelope<T> {
  return {
    data,
    meta: {
      source: 'mock',
      asOf: new Date().toISOString(),
      note: 'Data contoh untuk mencoba website Publik. Bukan data resmi.',
    },
  };
}

export const mockAdapter: PublicDataAdapter = {
  listProducts: async () => asMock(products),
  getProduct: async (slug) => asMock(products.find((product) => product.slug === slug) ?? null),
  listPrograms: async () => asMock(programs),
  getProgram: async (slug) => asMock(programs.find((program) => program.slug === slug) ?? null),
  listVacancies: async () => asMock(vacancies),
  getVacancy: async (slug) => asMock(vacancies.find((vacancy) => vacancy.slug === slug) ?? null),
  listIndihomePackages: async () => asMock(indihomePackages),
  listBanners: async (page) => asMock(banners.filter((banner) => banner.page === page)),
  getCompanyProfile: async () => asMock(company),
  getIndihomeInfo: async () => asMock(indihomeInfo),
  getDigiposInfo: async () => asMock(digiposInfo),
};
