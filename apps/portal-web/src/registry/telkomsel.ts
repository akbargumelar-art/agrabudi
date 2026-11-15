import type { Section } from './types';

/** Inventaris Portal Telkomsel (PRD 2.8). */
export const telkomsel: Section = {
  id: 'telkomsel',
  label: 'Telkomsel',
  prefix: '/telkomsel',
  description: 'Operasional distribusi Telkomsel.',
  home: '/telkomsel/dashboard',
  groups: [
    {
      label: 'Dashboard',
      slug: 'dashboard',
      behavior: 'Ringkasan sesuai wilayah/tim, filter, tanggal pembaruan.',
    },
    {
      label: 'Laporan Looker',
      slug: 'laporan-looker',
      behavior: 'Laporan berizin; embed/tautan tidak boleh membuka data ke publik.',
    },
    {
      label: 'Outlet',
      slug: 'outlet',
      behavior: 'Master, penugasan, posisi stok, ringkasan omzet.',
      children: [
        { label: 'Register Outlet', slug: 'register-outlet' },
        { label: 'Stock Perdana', slug: 'stock-perdana' },
        { label: 'Stock Voucher', slug: 'stock-voucher' },
        { label: 'Omzet Outlet', slug: 'omzet-outlet' },
      ],
    },
    {
      label: 'Sales Plan',
      slug: 'sales-plan',
      behavior: 'Rencana dan realisasi menurut periode/tim/produk.',
      children: [
        { label: 'Perdana', slug: 'perdana' },
        { label: 'Voucher Fisik', slug: 'voucher-fisik' },
        { label: 'CVM', slug: 'cvm' },
        { label: 'Material POP', slug: 'material-pop' },
      ],
    },
    {
      label: 'Sellthru',
      slug: 'sellthru',
      behavior: 'Laporan sumber penjualan, deduplikasi dan rekonsiliasi.',
      children: [
        { label: 'ST Nota', slug: 'st-nota' },
        { label: 'ST Digipos', slug: 'st-digipos' },
        { label: 'Penjualan D2C', slug: 'penjualan-d2c' },
      ],
    },
    {
      label: 'Performansi',
      slug: 'performansi',
      behavior: 'Metrik terdefinisi, sumber, drill-down dan agregasi yang benar.',
      children: [
        { label: 'TopLine', slug: 'topline' },
        { label: '5s-4r', slug: '5s-4r' },
        { label: 'Market Share', slug: 'market-share' },
        { label: 'Aktifasi', slug: 'aktifasi' },
        { label: 'Sellout', slug: 'sellout' },
        { label: 'Inject Voucher Fisik', slug: 'inject-voucher-fisik' },
        { label: 'Redeem Voucher Fisik', slug: 'redeem-voucher-fisik' },
        { label: 'SO Barcode Perdana', slug: 'so-barcode-perdana' },
        { label: 'SO Barcode Voucher', slug: 'so-barcode-voucher' },
      ],
    },
    {
      label: 'KPI',
      slug: 'kpi',
      behavior: 'Target, realisasi, bobot/rumus berversi.',
      children: [
        { label: 'KPI Cluster', slug: 'kpi-cluster' },
        { label: 'KPI Salesforce', slug: 'kpi-salesforce' },
      ],
    },
    {
      label: 'Program',
      slug: 'program',
      behavior: 'Peserta, mekanisme, pencapaian menurut aturan resmi.',
      children: [
        { label: 'SCS', slug: 'scs' },
        { label: 'Retina', slug: 'retina' },
        { label: 'Dealing Misi', slug: 'dealing-misi' },
      ],
    },
    {
      label: 'Fee / Komisi',
      slug: 'fee-komisi',
      behavior: 'Draft perhitungan, rincian, approval/finalisasi periode jika disetujui.',
      children: [
        { label: 'Management Fee', slug: 'management-fee' },
        { label: 'Marketing Fee', slug: 'marketing-fee' },
        { label: 'Gross Profit', slug: 'gross-profit' },
      ],
    },
    {
      label: 'DOA',
      slug: 'doa',
      behavior: 'Alokasi serial, posisi stok dan riwayat.',
      children: [
        { label: 'Alokasi', slug: 'alokasi' },
        { label: 'List SN', slug: 'list-sn' },
        { label: 'Stock', slug: 'stock' },
      ],
    },
    {
      label: 'Direct to Customer',
      slug: 'direct-to-customer',
      behavior: 'Penjualan/aktivitas dan relasi sasaran D2C.',
      children: [
        { label: 'Penjualan', slug: 'penjualan' },
        { label: 'Recharge', slug: 'recharge' },
        { label: 'Event / Dealing', slug: 'event-dealing' },
        { label: 'KPI', slug: 'kpi' },
        { label: 'Sekolah/Kampus', slug: 'sekolah-kampus' },
        { label: 'Instansi/Komunitas', slug: 'instansi-komunitas' },
      ],
    },
    {
      label: 'Monitoring POP',
      slug: 'monitoring-pop',
      behavior: 'Distribusi/penempatan, kondisi dan bukti.',
    },
    {
      label: 'Komplain',
      slug: 'komplain',
      behavior: 'Tiket, penanggung jawab, status, catatan dan riwayat.',
    },
    {
      label: 'Dokumentasi',
      slug: 'dokumentasi',
      behavior: 'Aktivitas dan berkas privat sesuai penugasan.',
      children: [
        { label: 'Monitoring Visit', slug: 'monitoring-visit' },
        { label: 'Dokumen', slug: 'dokumen' },
        { label: 'Video Roleplay', slug: 'video-roleplay' },
      ],
    },
    {
      label: 'Setting',
      slug: 'setting',
      behavior: 'Target dan impor tervalidasi.',
      children: [
        { label: 'Target', slug: 'target' },
        { label: 'Upload Data', slug: 'upload-data' },
      ],
    },
    {
      label: 'Link Penting',
      slug: 'link-penting',
      behavior: 'Daftar tautan terkurasi sesuai audiens.',
    },
    {
      label: 'User Management',
      slug: 'user-management',
      behavior: 'Tampilan pengguna unit dari layanan identitas operasional.',
    },
  ],
};
