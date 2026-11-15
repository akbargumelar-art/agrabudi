import { defineConfig } from '@playwright/test';
import { ports } from './tests/e2e/ports';

/** E2E berjalan terhadap hasil build, bukan dev server. */
const appEnv = {
  NEXT_PUBLIC_APP_URL_PUBLIC: `http://localhost:${ports.public}`,
  NEXT_PUBLIC_APP_URL_OUTLET: `http://localhost:${ports.outlet}`,
  NEXT_PUBLIC_APP_URL_PORTAL: `http://localhost:${ports.portal}`,
  NEXT_PUBLIC_DATA_SOURCE: 'mock',
  VITE_APP_URL_PUBLIC: `http://localhost:${ports.public}`,
  VITE_APP_URL_OUTLET: `http://localhost:${ports.outlet}`,
  VITE_APP_URL_PORTAL: `http://localhost:${ports.portal}`,
  VITE_DATA_SOURCE: 'mock',
  NEXT_TELEMETRY_DISABLED: '1',
};

/** Lima lebar layar wajib (PRD AS-05, rancangan build bagian 3). */
const widths = [360, 390, 768, 1024, 1440];

export default defineConfig({
  testDir: 'apps',
  testMatch: '**/e2e/**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [['list']],
  use: {
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  projects: widths.map((width) => ({
    name: `w${width}`,
    use: {
      viewport: { width, height: width < 768 ? 780 : 900 },
      hasTouch: width < 768,
    },
  })),
  webServer: [
    {
      command: `pnpm --filter @agrabudi/public-web build && pnpm --filter @agrabudi/public-web exec next start -p ${ports.public}`,
      url: `http://localhost:${ports.public}`,
      env: appEnv,
      timeout: 240_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm --filter @agrabudi/outlet-web build && pnpm --filter @agrabudi/outlet-web exec vite preview --port ${ports.outlet} --strictPort`,
      url: `http://localhost:${ports.outlet}`,
      env: appEnv,
      timeout: 240_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm --filter @agrabudi/portal-web build && pnpm --filter @agrabudi/portal-web exec vite preview --port ${ports.portal} --strictPort`,
      url: `http://localhost:${ports.portal}`,
      env: appEnv,
      timeout: 240_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm --filter @agrabudi/web-admin build && pnpm --filter @agrabudi/web-admin exec vite preview --port ${ports.webAdmin} --strictPort`,
      url: `http://localhost:${ports.webAdmin}/web-admin/`,
      env: appEnv,
      timeout: 240_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
