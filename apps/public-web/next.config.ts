import type { NextConfig } from 'next';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';

const REQUIRED_ENV = [
  'NEXT_PUBLIC_APP_URL_PUBLIC',
  'NEXT_PUBLIC_APP_URL_OUTLET',
  'NEXT_PUBLIC_APP_URL_PORTAL',
  'NEXT_PUBLIC_DATA_SOURCE',
];

export default function config(phase: string): NextConfig {
  // Build tanpa URL aplikasi atau sumber data yang eksplisit digagalkan,
  // supaya tidak ada tautan atau data bawaan yang ikut ke staging/produksi.
  // `next typegen` (dipakai typecheck) memakai fase yang sama tetapi tidak menghasilkan bundle.
  const isTypegen = process.argv.includes('typegen');
  if (phase === PHASE_PRODUCTION_BUILD && !isTypegen) {
    const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Variabel environment wajib belum diisi: ${missing.join(', ')}`);
    }
  }
  return {
    // Paket workspace dikirim sebagai sumber TypeScript, jadi Next yang mengompilasinya.
    transpilePackages: ['@agrabudi/ui', '@agrabudi/contracts'],
    poweredByHeader: false,
  };
}
