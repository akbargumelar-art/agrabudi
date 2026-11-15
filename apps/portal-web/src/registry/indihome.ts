import type { Section } from './types';

/** Inventaris Portal IndiHome (PRD 2.9). */
export const indihome: Section = {
  id: 'indihome',
  label: 'IndiHome',
  prefix: '/indihome',
  description: 'Operasional keagenan IndiHome.',
  home: '/indihome/dashboard',
  groups: [
    { label: 'Dashboard', slug: 'dashboard', behavior: 'Ringkasan order/status/KPI.' },
    { label: 'KPI', slug: 'kpi', behavior: 'Target dan realisasi sesuai definisi.' },
    {
      label: 'Performance',
      slug: 'performance',
      behavior: 'Histori status serta rekap penjualan.',
      children: [
        { label: 'Penjualan', slug: 'penjualan' },
        { label: 'IO / RE / PS', slug: 'io-re-ps' },
      ],
    },
    {
      label: 'CTB',
      slug: 'ctb',
      behavior: 'Tagihan pelanggan per periode, sumber dan waktu pembaruan.',
      children: [{ label: 'Tagihan', slug: 'tagihan' }],
    },
    { label: 'User Management', slug: 'user-management', behavior: 'Akun unit dan cakupan akses.' },
    {
      label: 'Setting',
      slug: 'setting',
      behavior: 'Pengaturan target, template dan batch impor.',
      children: [
        { label: 'Target', slug: 'target' },
        { label: 'Upload Data Performance', slug: 'upload-data-performance' },
      ],
    },
    {
      label: 'Database Pelanggan',
      slug: 'database-pelanggan',
      behavior: 'Alias menuju Pelanggan → Database, bukan tabel data kedua.',
      aliasOf: '/indihome/pelanggan/database',
    },
    {
      label: 'POP Material',
      slug: 'pop-material',
      behavior: 'Material dan distribusi/penempatan.',
    },
    {
      label: 'Clock-in MB',
      slug: 'clock-in-mb',
      behavior: 'Kehadiran/aktivitas menurut aturan MB yang perlu disahkan.',
    },
    {
      label: 'Dokumentasi',
      slug: 'dokumentasi',
      behavior: 'Aktivitas, bukti, petugas dan cakupan.',
      children: [
        { label: 'Door to Door', slug: 'door-to-door' },
        { label: 'Open Booth', slug: 'open-booth' },
        { label: 'Video Roleplay', slug: 'video-roleplay' },
      ],
    },
    {
      label: 'Pelanggan',
      slug: 'pelanggan',
      behavior: 'Master pelanggan dan order dengan riwayat status.',
      children: [
        { label: 'Database', slug: 'database' },
        { label: 'Input Order', slug: 'input-order' },
      ],
    },
    {
      label: 'Komplain / Kendala',
      slug: 'komplain-kendala',
      behavior: 'Tiket layanan/operasional, penanggung jawab dan riwayat.',
    },
    {
      label: 'Fee / Komisi',
      slug: 'fee-komisi',
      behavior: 'Perhitungan terbatas sesuai izin dan aturan.',
      children: [
        { label: 'Management Fee', slug: 'management-fee' },
        { label: 'Marketing Fee', slug: 'marketing-fee' },
      ],
    },
  ],
};
