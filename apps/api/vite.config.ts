import { defineConfig } from 'vitest/config';

/**
 * Build API sebagai bundel Node (SSR). Paket workspace (@agrabudi/contracts) ikut dibundel
 * karena dikirim sebagai sumber TypeScript; dependency npm lain tetap eksternal dan
 * dipasang di image produksi. Dua entry: server dan migrasi.
 */
export default defineConfig({
  build: {
    ssr: true,
    target: 'node22',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: 'src/main.ts',
        migrate: 'src/db/migrate-cli.ts',
        'create-account': 'src/scripts/create-account.ts',
      },
      output: { format: 'es', entryFileNames: '[name].js' },
    },
  },
  ssr: { noExternal: ['@agrabudi/contracts'] },
  test: {
    include: ['test/**/*.test.ts'],
    globalSetup: ['test/global-setup.ts'],
    // Satu MySQL untuk semua berkas tes; berkas dijalankan berurutan supaya data tidak saling ganggu.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 180_000,
  },
});
