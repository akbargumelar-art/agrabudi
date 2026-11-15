import { expect, test } from '@playwright/test';
import {
  baseUrls,
  expectBottomNavRule,
  expectNoPageOverflow,
  isPhone,
  trackErrors,
} from '../../../tests/e2e/helpers';

const base = baseUrls.webAdmin;

/** Route console dari PRD 2.3, relatif terhadap /web-admin. */
const consoleRoutes = [
  { path: '/', title: 'Dashboard Website' },
  { path: '/pages', title: 'Halaman Perusahaan' },
  { path: '/banners', title: 'Banner' },
  { path: '/navigation', title: 'Navigasi' },
  { path: '/layouts', title: 'Layout' },
  { path: '/assets', title: 'Aset Website' },
  { path: '/preview', title: 'Preview' },
  { path: '/publications', title: 'Riwayat Publikasi' },
  { path: '/audit', title: 'Audit Konten' },
];

test('semua route console tampil di bawah /web-admin tanpa overflow dan tanpa error', async ({
  page,
}) => {
  const errors = trackErrors(page);
  for (const route of consoleRoutes) {
    await page.goto(base + route.path);
    await expect(page.locator('h1'), route.path).toHaveText(route.title);
    await expectBottomNavRule(page);
    await expectNoPageOverflow(page, route.path);
  }
  expect(errors).toEqual([]);
});

test('console terpisah dari tiga aplikasi dan dari menu operasional', async ({ page }) => {
  await page.goto(`${base}/`);
  await expect(page.getByRole('navigation', { name: 'Pindah aplikasi' })).toHaveCount(0);
  await expect(page.getByText('Console Administrator Web').first()).toBeVisible();
  for (const forbidden of ['Order', 'Lamaran', 'Fee', 'Harga', 'KPI', 'User Management']) {
    await expect(page.getByRole('link', { name: forbidden })).toHaveCount(0);
  }
  await expect(page.locator('[data-mock-ribbon]')).toBeVisible();
  await expect(page.locator('[data-mock-label]').first()).toBeVisible();
});

test('halaman login console berdiri sendiri dan belum aktif', async ({ page }) => {
  await page.goto(`${base}/login`);
  await expect(page.locator('h1')).toHaveText('Masuk');
  await expect(page.getByText('Akun Portal dan Outlet tidak bisa dipakai di sini')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Masuk' })).toBeDisabled();
  await expect(page.locator('[data-bottom-nav]')).toHaveCount(0);
  await expectNoPageOverflow(page, '/login');
});

test('menu console: sidebar di layar lebar, panel Lainnya di smartphone', async ({ page }) => {
  await page.goto(`${base}/banners`);
  if (isPhone(page)) {
    await expect(page.locator('[data-bottom-nav] [aria-current="page"]')).toHaveText('Banner');
    const more = page.locator('[data-bottom-nav]').getByRole('button', { name: 'Lainnya' });
    await more.click();
    const dialog = page.getByRole('dialog', { name: 'Menu console' });
    await dialog.getByRole('link', { name: 'Audit Konten' }).click();
    await expect(page).toHaveURL(`${base}/audit`);
    await expect(dialog).toBeHidden();
  } else {
    const menu = page.getByRole('navigation', { name: 'Menu console' });
    await expect(menu.locator('[aria-current="page"]')).toHaveText('Banner');
    await menu.getByRole('link', { name: 'Audit Konten' }).click();
    await expect(page).toHaveURL(`${base}/audit`);
    await expect(menu.locator('[aria-current="page"]')).toHaveText('Audit Konten');
  }
});
