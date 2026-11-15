import type { Section } from './types';

/**
 * Inventaris Admin operasional (PRD 2.10). Ini bukan console Administrator Web:
 * konten institusional, banner, dan layout dikelola di /web-admin oleh akun terpisah.
 */
export const admin: Section = {
  id: 'admin',
  label: 'Admin operasional',
  prefix: '/admin',
  description: 'Pengelolaan konten dan data bisnis oleh Admin berizin.',
  home: '/admin/kelola-karir',
  groups: [
    {
      label: 'Kelola Karir',
      slug: 'kelola-karir',
      behavior: 'Lowongan dan lamaran dikelola Admin dengan izin rekrutmen. CV bersifat privat.',
      children: [
        { label: 'Lowongan', slug: 'lowongan' },
        { label: 'Lamaran', slug: 'lamaran' },
        { label: 'Status tindak lanjut', slug: 'status-tindak-lanjut' },
        { label: 'Template komunikasi', slug: 'template-komunikasi' },
      ],
    },
    {
      label: 'ABKShop Pelanggan',
      slug: 'abkshop-pelanggan',
      behavior: 'Katalog pelanggan. Data, harga, dan aturannya terpisah dari ABKShop Outlet.',
      children: [
        { label: 'Kategori', slug: 'kategori' },
        { label: 'Produk', slug: 'produk' },
        { label: 'Harga', slug: 'harga' },
        { label: 'Media produk', slug: 'media-produk' },
        { label: 'Status publikasi', slug: 'status-publikasi' },
      ],
    },
    {
      label: 'ABKShop Outlet',
      slug: 'abkshop-outlet',
      behavior: 'Katalog mitra, aturan harga outlet, stok, serta verifikasi dan pemrosesan order.',
      children: [
        { label: 'Kategori', slug: 'kategori' },
        { label: 'Paket', slug: 'paket' },
        { label: 'Harga/aturan outlet', slug: 'harga-aturan-outlet' },
        { label: 'Stok/snapshot', slug: 'stok-snapshot' },
        { label: 'Order', slug: 'order' },
        { label: 'Pemenuhan', slug: 'pemenuhan' },
      ],
    },
    {
      label: 'IndiHome',
      slug: 'indihome',
      behavior: 'Paket/layanan, lead, dan order pelanggan dikelola Admin unit IndiHome.',
      children: [
        { label: 'Paket/layanan', slug: 'paket-layanan' },
        { label: 'FAQ bisnis', slug: 'faq-bisnis' },
        { label: 'Lead', slug: 'lead' },
        { label: 'Database pelanggan', slug: 'database-pelanggan' },
        { label: 'Input/order', slug: 'input-order' },
        { label: 'Status', slug: 'status' },
      ],
    },
    {
      label: 'Promo & Program',
      slug: 'promo-program',
      behavior: 'Program per audiens dan unit: periode, syarat, peserta, dan pencapaian.',
      children: [
        { label: 'Program pelanggan', slug: 'program-pelanggan' },
        { label: 'Program outlet', slug: 'program-outlet' },
        { label: 'Program internal', slug: 'program-internal' },
        { label: 'Audiens', slug: 'audiens' },
        { label: 'Periode', slug: 'periode' },
        { label: 'Syarat', slug: 'syarat' },
        { label: 'Peserta/pencapaian', slug: 'peserta-pencapaian' },
      ],
    },
    {
      label: 'Daftar Digipos',
      slug: 'daftar-digipos',
      behavior: 'Syarat, form pendaftaran, verifikasi, dan status pendaftar.',
      children: [
        { label: 'Informasi/syarat', slug: 'informasi-syarat' },
        { label: 'Form field yang diizinkan', slug: 'form-field' },
        { label: 'Pendaftaran', slug: 'pendaftaran' },
        { label: 'Verifikasi', slug: 'verifikasi' },
        { label: 'Status', slug: 'status' },
      ],
    },
    {
      label: 'Admin Input',
      slug: 'admin-input',
      behavior: 'Input dan unggah data sesuai izin.',
      children: [
        { label: 'Outlet', slug: 'outlet' },
        { label: 'Poin Outlet', slug: 'poin-outlet' },
        { label: 'Kalkulator Cuan', slug: 'kalkulator-cuan' },
        { label: 'Upload Database', slug: 'upload-database' },
        { label: 'Data Telkomsel/IndiHome', slug: 'data-telkomsel-indihome' },
      ],
    },
    {
      label: 'Pengaturan operasional',
      slug: 'pengaturan-operasional',
      behavior: 'Target, template unggah, master wilayah/tim, dan kebijakan order yang disepakati.',
      children: [
        { label: 'Target', slug: 'target' },
        { label: 'Template unggah', slug: 'template-unggah' },
        { label: 'Master wilayah/tim', slug: 'master-wilayah-tim' },
        { label: 'Kebijakan order', slug: 'kebijakan-order' },
      ],
    },
    {
      label: 'User Management',
      slug: 'user-management',
      behavior: 'Pengguna operasional dalam scope grant yang diizinkan.',
    },
  ],
};
