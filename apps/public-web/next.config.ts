import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from 'next/constants';

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
    // Server mandiri hanya untuk image Docker (NEXT_OUTPUT=standalone di Dockerfile), supaya
    // `next start` untuk e2e tetap bisa dipakai. Tracing dari root monorepo agar paket workspace ikut.
    ...(process.env.NEXT_OUTPUT === 'standalone'
      ? {
          output: 'standalone' as const,
          outputFileTracingRoot: fileURLToPath(new URL('../../', import.meta.url)),
        }
      : {}),
    // Pengembangan lokal: form di browser memanggil /api/public di origin yang sama.
    // Produksi: Nginx meneruskan /api/public ke API sebelum sampai ke Next.js (PRD 4.3).
    async rewrites() {
      if (phase !== PHASE_DEVELOPMENT_SERVER) return [];
      const target = process.env.API_DEV_PROXY ?? 'http://localhost:4000';
      return [{ source: '/api/public/:path*', destination: `${target}/api/public/:path*` }];
    },
  };
}
