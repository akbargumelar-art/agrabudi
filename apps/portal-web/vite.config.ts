import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

const REQUIRED_ENV = [
  'VITE_APP_URL_PUBLIC',
  'VITE_APP_URL_OUTLET',
  'VITE_APP_URL_PORTAL',
  'VITE_DATA_SOURCE',
];

export default defineConfig(({ command, mode }) => {
  // Build tanpa URL aplikasi digagalkan,
  // supaya tidak ada tautan bawaan yang ikut ke staging/produksi.
  if (command === 'build') {
    const env = loadEnv(mode, import.meta.dirname, 'VITE_');
    const missing = REQUIRED_ENV.filter((key) => !env[key]);
    if (missing.length > 0) {
      throw new Error(`Variabel environment wajib belum diisi: ${missing.join(', ')}`);
    }
  }
  return {
    plugins: [react(), tailwindcss()],
    server: { port: 3002, strictPort: true },
    test: {
      include: ['src/**/*.test.{ts,tsx}'],
      // Nilai uji saja, bukan bawaan build: build tetap gagal tanpa URL dari environment.
      env: {
        VITE_APP_URL_PUBLIC: 'http://localhost:3000',
        VITE_APP_URL_OUTLET: 'http://localhost:3001',
        VITE_APP_URL_PORTAL: 'http://localhost:3002',
      },
    },
  };
});
