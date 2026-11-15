import { expect, test } from '@playwright/test';
import {
  baseUrls,
  expectActiveApp,
  expectBottomNavRule,
  expectNoPageOverflow,
  isDesktop,
  isPhone,
  trackErrors,
} from '../../../tests/e2e/helpers';
import { moduleRoutes, sections } from '../src/registry';

const base = baseUrls.portal;
const topRoutes = ['/', '/aktivitas', '/laporan', '/menu', '/akun', '/login'];

test('halaman utama Portal tampil tanpa overflow dan tanpa error', async ({ page }) => {
  const errors = trackErrors(page);
  for (const route of topRoutes) {
    await page.goto(base + route);
    await expect(page.locator('h1'), route).toHaveCount(1);
    await expectActiveApp(page, 'Portal');
    await expectBottomNavRule(page);
    await expectNoPageOverflow(page, route);
    await expect(page.locator('[data-stage-notice]')).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('semua modul di route registry (PRD 2.8-2.10) bisa dibuka lewat deep link', async ({
  page,
}) => {
  test.setTimeout(240_000);
  const errors = trackErrors(page);
  for (const route of moduleRoutes) {
    await page.goto(base + route.path);
    if (route.aliasOf) {
      await expect(page, route.path).toHaveURL(base + route.aliasOf);
      continue;
    }
    await expect(page.locator('h1'), route.path).toHaveText(route.title);
    await expectNoPageOverflow(page, route.path);
  }
  expect(errors).toEqual([]);
});

test('modul kerangka tidak menampilkan angka contoh', async ({ page }) => {
  await page.goto(`${base}/telkomsel/kpi/kpi-cluster`);
  await expect(page.getByText('Kerangka', { exact: true })).toBeVisible();
  await expect(page.getByText('Belum ada data untuk ditampilkan')).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText('Rp');
  await expect(page.locator('main')).not.toContainText('%');
});

test('awalan bagian dialihkan ke halaman awalnya', async ({ page }) => {
  for (const section of sections) {
    await page.goto(base + section.prefix);
    await expect(page).toHaveURL(base + section.home);
  }
});

test('sidebar hanya di desktop; di layar lain modul dibuka dari Semua Menu', async ({ page }) => {
  await page.goto(`${base}/telkomsel/outlet/register-outlet`);
  const sidebar = page.getByRole('navigation', { name: 'Modul Portal' });
  if (isDesktop(page)) {
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator('[aria-current="page"]')).toHaveText('Register Outlet');
    await sidebar.getByRole('link', { name: 'Stock Voucher' }).click();
    await expect(page).toHaveURL(`${base}/telkomsel/outlet/stock-voucher`);
  } else {
    await expect(sidebar).toBeHidden();
    const nav = isPhone(page)
      ? page.locator('[data-bottom-nav]')
      : page.getByRole('navigation', { name: 'Menu utama' });
    await expect(nav.locator('[aria-current="page"]')).toHaveText(
      isPhone(page) ? 'Lainnya' : 'Semua Menu',
    );
    await nav.locator('[aria-current="page"]').click();
    await expect(page).toHaveURL(`${base}/menu`);
    await page.getByRole('main').getByRole('link', { name: 'Stock Voucher' }).click();
    await expect(page).toHaveURL(`${base}/telkomsel/outlet/stock-voucher`);
  }
});

test('Administrator Web tidak muncul di Portal operasional', async ({ page }) => {
  await page.goto(`${base}/menu`);
  await expect(page.locator('a[href*="web-admin"]')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('Administrator Web');

  // Login Portal tidak menawarkan pilihan jabatan atau peran.
  await page.goto(`${base}/login`);
  await expect(page.locator('select')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Masuk' })).toBeDisabled();
});
