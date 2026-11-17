import {
  publicationRecordSchema,
  siteBannerSchema,
  sitePageSchema,
  type DataEnvelope,
  type PublicationRecord,
  type SiteBanner,
  type SitePage,
} from '@agrabudi/contracts';
import { logoHorizontal, logoHorizontalOnDark, logoMark } from '@agrabudi/ui';
import { bannerArt, officeArt, programArt } from '@agrabudi/ui/mock-art';
import type { WebAdminDataAdapter } from '../adapter';
import type { AuditEvent, LayoutSection, NavItem, SiteAsset } from '../types';

/**
 * DATA CONTOH untuk pengaturan website. Judul, status, dan tanggal rekaan; bukan isi
 * website resmi dan tidak boleh dipakai sebagai seed produksi. Perubahan hanya hidup di
 * memori browser selama halaman terbuka.
 */
const ACTOR = 'Laras Wulandari (adminweb)';

let pages: SitePage[] = [
  { id: 'hal-1', site: 'public', slug: 'tentang', title: 'Tentang Kami', status: 'published', updatedAt: '2026-11-08T04:00:00Z' },
  { id: 'hal-2', site: 'public', slug: 'tentang/area', title: 'Area Layanan', status: 'published', updatedAt: '2026-11-12T09:30:00Z' },
  { id: 'hal-3', site: 'public', slug: 'tentang/kantor', title: 'Lokasi Kantor', status: 'review', updatedAt: '2026-11-13T02:10:00Z' },
  { id: 'hal-4', site: 'public', slug: 'kontak', title: 'Hubungi Kami', status: 'published', updatedAt: '2026-11-10T07:45:00Z' },
  { id: 'hal-5', site: 'public', slug: 'tentang/sejarah', title: 'Sejarah Perusahaan', status: 'draft', updatedAt: '2026-11-14T08:20:00Z' },
  { id: 'hal-6', site: 'public', slug: 'kebijakan-privasi', title: 'Kebijakan Privasi', status: 'archived', updatedAt: '2026-10-28T07:45:00Z' },
].map((page) => sitePageSchema.parse(page));

let banners: SiteBanner[] = [
  {
    id: 'banner-1',
    site: 'public',
    page: 'home',
    slot: 'hero',
    title: 'Kuota besar untuk aktivitas harian',
    subtitle: 'Perdana Internet tersedia di outlet mitra Agrabudi se-Cirebon Raya.',
    ctaLabel: 'Lihat produk',
    ctaHref: '/produk',
    imageUrl: bannerArt('banner-hero-1', 'red'),
    startsAt: '2026-11-01',
    endsAt: '2026-11-30',
    status: 'published',
  },
  {
    id: 'banner-2',
    site: 'public',
    page: 'home',
    slot: 'hero',
    title: 'Internet rumah untuk keluarga',
    subtitle: 'Daftarkan minat pemasangan IndiHome, petugas kami menghubungi Anda.',
    ctaLabel: 'Cek paket IndiHome',
    ctaHref: '/indihome',
    imageUrl: bannerArt('banner-hero-2', 'ink'),
    startsAt: '2026-11-01',
    endsAt: '2026-12-31',
    status: 'published',
  },
  {
    id: 'banner-3',
    site: 'outlet',
    page: 'home',
    slot: 'atas',
    title: 'Program outlet akhir tahun',
    subtitle: 'Kumpulkan kupon dari pembelian voucher fisik.',
    ctaLabel: 'Lihat program',
    ctaHref: '/program',
    imageUrl: programArt('banner-outlet-1', 'gold'),
    startsAt: '2026-12-01',
    endsAt: '2026-12-31',
    status: 'draft',
  },
].map((banner) => siteBannerSchema.parse(banner));

let publications: PublicationRecord[] = [
  { id: 'pub-4', objectType: 'banner', objectTitle: 'Internet rumah untuk keluarga', revision: 1, publishedAt: '2026-11-11T03:00:00Z' },
  { id: 'pub-3', objectType: 'page', objectTitle: 'Area Layanan', revision: 2, publishedAt: '2026-11-12T09:30:00Z' },
  { id: 'pub-2', objectType: 'banner', objectTitle: 'Kuota besar untuk aktivitas harian', revision: 2, publishedAt: '2026-11-09T03:00:00Z' },
  { id: 'pub-1', objectType: 'page', objectTitle: 'Tentang Kami', revision: 1, publishedAt: '2026-11-08T04:00:00Z' },
].map((record) => publicationRecordSchema.parse(record));

let navigation: NavItem[] = [
  { id: 'nav-1', site: 'public', label: 'Beranda', href: '/', visible: true, locked: true },
  { id: 'nav-2', site: 'public', label: 'Produk', href: '/produk', visible: true, locked: true },
  { id: 'nav-3', site: 'public', label: 'Promo', href: '/promo', visible: true, locked: false },
  { id: 'nav-4', site: 'public', label: 'IndiHome', href: '/indihome', visible: true, locked: false },
  { id: 'nav-5', site: 'public', label: 'Daftar Digipos', href: '/digipos', visible: true, locked: false },
  { id: 'nav-6', site: 'public', label: 'Karir', href: '/karir', visible: true, locked: false },
  { id: 'nav-7', site: 'public', label: 'Tentang', href: '/tentang', visible: true, locked: false },
  { id: 'nav-8', site: 'public', label: 'Kontak', href: '/kontak', visible: true, locked: false },
  { id: 'nav-9', site: 'outlet', label: 'Beranda', href: '/', visible: true, locked: true },
  { id: 'nav-10', site: 'outlet', label: 'ABKShop', href: '/abkshop', visible: true, locked: true },
  { id: 'nav-11', site: 'outlet', label: 'Program', href: '/program', visible: true, locked: false },
  { id: 'nav-12', site: 'outlet', label: 'Kalkulator Cuan', href: '/kalkulator', visible: true, locked: false },
  { id: 'nav-13', site: 'outlet', label: 'Akun', href: '/akun', visible: true, locked: true },
];

let layouts: LayoutSection[] = [
  { id: 'lay-1', page: 'Beranda Publik', label: 'Banner utama', component: 'Hero slider', visible: true },
  { id: 'lay-2', page: 'Beranda Publik', label: 'Produk pilihan', component: 'Grid produk', visible: true },
  { id: 'lay-3', page: 'Beranda Publik', label: 'Promo berjalan', component: 'Kartu program', visible: true },
  { id: 'lay-4', page: 'Beranda Publik', label: 'IndiHome', component: 'Ajakan dengan gambar', visible: true },
  { id: 'lay-5', page: 'Beranda Publik', label: 'Lowongan terbaru', component: 'Daftar lowongan', visible: false },
  { id: 'lay-6', page: 'Beranda Outlet', label: 'Dokumentasi pemenang', component: 'Slider foto', visible: true },
  { id: 'lay-7', page: 'Beranda Outlet', label: 'Program untuk Anda', component: 'Kartu program', visible: true },
  { id: 'lay-8', page: 'Beranda Outlet', label: 'Pintasan', component: 'Ikon menu', visible: true },
];

let assets: SiteAsset[] = [
  { id: 'aset-1', name: 'Logo Agrabudi horizontal', kind: 'logo', url: logoHorizontal.src, sizeKb: 21, uploadedAt: '2026-11-15T03:00:00Z' },
  { id: 'aset-2', name: 'Logo Agrabudi latar gelap', kind: 'logo', url: logoHorizontalOnDark.src, sizeKb: 20, uploadedAt: '2026-11-15T03:00:00Z' },
  { id: 'aset-3', name: 'Logo Agrabudi ikon', kind: 'logo', url: logoMark.src, sizeKb: 8, uploadedAt: '2026-11-15T03:00:00Z' },
  { id: 'aset-4', name: 'Kantor Cirebon (ilustrasi contoh)', kind: 'foto', url: officeArt('Kantor Cirebon', 'aset-kantor-1'), sizeKb: 6, uploadedAt: '2026-11-12T02:00:00Z' },
  { id: 'aset-5', name: 'Kantor Kuningan (ilustrasi contoh)', kind: 'foto', url: officeArt('Kantor Kuningan', 'aset-kantor-2'), sizeKb: 6, uploadedAt: '2026-11-12T02:00:00Z' },
  { id: 'aset-6', name: 'Banner hero merah (ilustrasi contoh)', kind: 'banner', url: bannerArt('banner-hero-1', 'red'), sizeKb: 5, uploadedAt: '2026-11-09T02:00:00Z' },
  { id: 'aset-7', name: 'Banner hero gelap (ilustrasi contoh)', kind: 'banner', url: bannerArt('banner-hero-2', 'ink'), sizeKb: 5, uploadedAt: '2026-11-09T02:00:00Z' },
  { id: 'aset-8', name: 'Program emas (ilustrasi contoh)', kind: 'ilustrasi', url: programArt('aset-program', 'gold'), sizeKb: 4, uploadedAt: '2026-11-05T02:00:00Z' },
];

let audit: AuditEvent[] = [
  { id: 'aud-5', at: '2026-11-14T08:20:00Z', actor: ACTOR, action: 'Membuat draft', object: 'Halaman: Sejarah Perusahaan' },
  { id: 'aud-4', at: '2026-11-13T02:10:00Z', actor: ACTOR, action: 'Mengajukan review', object: 'Halaman: Lokasi Kantor' },
  { id: 'aud-3', at: '2026-11-12T09:30:00Z', actor: ACTOR, action: 'Menerbitkan', object: 'Halaman: Area Layanan' },
  { id: 'aud-2', at: '2026-11-11T03:00:00Z', actor: ACTOR, action: 'Menerbitkan', object: 'Banner: Internet rumah untuk keluarga' },
  { id: 'aud-1', at: '2026-11-10T01:15:00Z', actor: ACTOR, action: 'Mengubah susunan', object: 'Navigasi' },
];

const now = () => new Date().toISOString();
const newId = (prefix: string) => `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;

function log(action: string, object: string) {
  audit = [{ id: newId('aud'), at: now(), actor: ACTOR, action, object }, ...audit];
}

function publish(objectType: PublicationRecord['objectType'], objectTitle: string) {
  const revision = publications.filter((item) => item.objectTitle === objectTitle).length + 1;
  publications = [
    publicationRecordSchema.parse({ id: newId('pub'), objectType, objectTitle, revision, publishedAt: now() }),
    ...publications,
  ];
}

const statusAction: Record<SitePage['status'], string> = {
  draft: 'Mengembalikan ke draft',
  review: 'Mengajukan review',
  published: 'Menerbitkan',
  archived: 'Mengarsipkan',
};

function asMock<T>(data: T): DataEnvelope<T> {
  return {
    data,
    meta: {
      source: 'mock',
      asOf: now(),
      note: 'Data contoh untuk pengaturan website. Bukan isi website resmi.',
    },
  };
}

export const mockAdapter: WebAdminDataAdapter = {
  listPages: async () => asMock(pages),
  updatePageStatus: async (id, status) => {
    const page = pages.find((item) => item.id === id);
    if (!page) return;
    pages = pages.map((item) => (item.id === id ? { ...item, status, updatedAt: now() } : item));
    log(statusAction[status], `Halaman: ${page.title}`);
    if (status === 'published') publish('page', page.title);
  },
  listBanners: async () => asMock(banners),
  saveBanner: async (input) => {
    const banner = siteBannerSchema.parse(input);
    const existing = banners.find((item) => item.id === banner.id);
    banners = existing ? banners.map((item) => (item.id === banner.id ? banner : item)) : [banner, ...banners];
    log(existing ? 'Mengubah' : 'Membuat', `Banner: ${banner.title}`);
    if (banner.status === 'published' && existing?.status !== 'published') publish('banner', banner.title);
  },
  deleteBanner: async (id) => {
    const banner = banners.find((item) => item.id === id);
    banners = banners.filter((item) => item.id !== id);
    if (banner) log('Menghapus', `Banner: ${banner.title}`);
  },
  listPublications: async () => asMock(publications),
  listNavigation: async () => asMock(navigation),
  saveNavigation: async (items) => {
    // Menu terkunci tetap tampil walau permintaan mencoba menyembunyikannya.
    navigation = items.map((item) => (item.locked ? { ...item, visible: true } : item));
    log('Mengubah susunan', 'Navigasi');
    publish('navigation', 'Navigasi');
  },
  listLayouts: async () => asMock(layouts),
  saveLayouts: async (items) => {
    layouts = items;
    log('Mengubah susunan', 'Layout halaman');
    publish('layout', 'Layout halaman');
  },
  listAssets: async () => asMock(assets),
  addAsset: async (asset) => {
    assets = [{ ...asset, id: newId('aset'), uploadedAt: now() }, ...assets];
    log('Mengunggah', `Aset: ${asset.name}`);
  },
  deleteAsset: async (id) => {
    const asset = assets.find((item) => item.id === id);
    assets = assets.filter((item) => item.id !== id);
    if (asset) log('Menghapus', `Aset: ${asset.name}`);
  },
  listAudit: async () => asMock(audit),
};
