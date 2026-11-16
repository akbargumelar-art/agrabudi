import type { Section } from './types';

/**
 * Pengaturan website untuk peran Admin Web (PRD 2.3). Alamatnya tetap di bawah /web-admin.
 * Hanya isi institusional dan tampilan; tidak ada data bisnis di bagian ini.
 */
export const website: Section = {
  id: 'website',
  label: 'Website',
  prefix: '/web-admin',
  description: 'Isi dan tampilan website Publik, Outlet, dan Portal.',
  home: '/web-admin/dashboard',
  groups: [
    {
      label: 'Dashboard Website',
      slug: 'dashboard',
      behavior: 'Ringkasan status website dan publikasi.',
    },
    {
      label: 'Halaman Perusahaan',
      slug: 'pages',
      behavior: 'Profil, Tentang Kami, area, kantor, kontak, informasi institusional.',
    },
    {
      label: 'Banner',
      slug: 'banners',
      behavior: 'Banner menurut website, halaman, slot, periode.',
    },
    {
      label: 'Halaman ABKShop',
      slug: 'abkshop',
      behavior: 'Alamat halaman pemesanan yang disematkan di menu ABKShop Outlet.',
    },
    {
      label: 'Navigasi',
      slug: 'navigation',
      behavior: 'Susunan menu yang diizinkan dan tautan aplikasi.',
    },
    {
      label: 'Layout',
      slug: 'layouts',
      behavior: 'Urutan bagian dan komponen tampilan yang telah disediakan.',
    },
    {
      label: 'Aset Website',
      slug: 'assets',
      behavior: 'Logo resmi, foto kantor, gambar korporat, aset banner.',
    },
    {
      label: 'Preview',
      slug: 'preview',
      behavior: 'Preview draft, pilihan website dan ukuran layar.',
    },
    {
      label: 'Riwayat Publikasi',
      slug: 'publications',
      behavior: 'Riwayat terbit dan pemulihan versi konten.',
    },
    { label: 'Audit Konten', slug: 'audit', behavior: 'Audit perubahan khusus konten website.' },
  ],
};
