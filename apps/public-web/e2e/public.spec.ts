import { expect, test } from '@playwright/test';
import {
  baseUrls,
  expectActiveApp,
  expectBottomNavRule,
  expectNoPageOverflow,
  isPhone,
  trackErrors,
} from '../../../tests/e2e/helpers';

const base = baseUrls.public;

/** Seluruh route Publik dari PRD 2.6. */
const routes = [
  '/',
  '/tentang',
  '/tentang/area',
  '/tentang/kantor',
  '/kontak',
  '/produk',
  '/produk/perdana-contoh-1',
  '/indihome',
  '/promo',
  '/promo/promo-contoh-1',
  '/digipos',
  '/karir',
  '/karir/posisi-contoh-1',
  '/karir/posisi-contoh-1/lamar',
];

test('semua route Publik tampil tanpa overflow dan tanpa error', async ({ page }) => {
  const errors = trackErrors(page);
  for (const route of routes) {
    const response = await page.goto(base + route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator('h1'), route).toHaveCount(1);
    await expect(page.locator('h1'), route).toBeVisible();
    await expectActiveApp(page, 'Publik');
    await expectBottomNavRule(page);
    await expectNoPageOverflow(page, route);
  }
  expect(errors).toEqual([]);
});

test('bar aplikasi lebih kecil dari menu utama dan garis aktifnya merah', async ({ page }) => {
  await page.goto(base);
  const switcher = page.getByRole('navigation', { name: 'Pindah aplikasi' });
  const active = switcher.locator('[aria-current="true"]');
  const borderColor = await active.evaluate(
    (element) => getComputedStyle(element).borderBottomColor,
  );
  expect(borderColor).toBe('rgb(213, 18, 43)');

  if (!isPhone(page)) {
    const switcherSize = await active.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );
    const menuLink = page
      .getByRole('navigation', { name: 'Menu utama' })
      .getByRole('link', { name: 'Produk' });
    const menuSize = await menuLink.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );
    expect(switcherSize).toBeLessThan(menuSize);
  }
});

test('Karir tetap mengaktifkan Publik dan menu Karir', async ({ page }) => {
  await page.goto(`${base}/karir/posisi-contoh-1`);
  await expectActiveApp(page, 'Publik');
  const nav = isPhone(page)
    ? page.locator('[data-bottom-nav]')
    : page.getByRole('navigation', { name: 'Menu utama' });
  await expect(nav.locator('[aria-current="page"]')).toHaveText('Karir');
});

test('pengalih aplikasi membuka Outlet dan Portal di URL dari environment', async ({ page }) => {
  await page.goto(base);
  const switcher = page.getByRole('navigation', { name: 'Pindah aplikasi' });
  await switcher.getByRole('link', { name: 'Outlet' }).click();
  await expect(page).toHaveURL(`${baseUrls.outlet}/`);
  await expectActiveApp(page, 'Outlet');

  await page
    .getByRole('navigation', { name: 'Pindah aplikasi' })
    .getByRole('link', { name: 'Portal' })
    .click();
  await expect(page).toHaveURL(`${baseUrls.portal}/`);
  await expectActiveApp(page, 'Portal');

  await page
    .getByRole('navigation', { name: 'Pindah aplikasi' })
    .getByRole('link', { name: 'Publik' })
    .click();
  await expect(page).toHaveURL(`${base}/`);
  await expectActiveApp(page, 'Publik');
});

test('data contoh selalu berlabel', async ({ page }) => {
  await page.goto(base);
  await expect(page.locator('[data-mock-ribbon]')).toBeVisible();
  expect(await page.locator('[data-mock-label]').count()).toBeGreaterThanOrEqual(4);
  await page.goto(`${base}/produk`);
  await expect(page.locator('[data-mock-label]').first()).toBeVisible();
});

test('isi institusional yang belum disahkan tidak diisi karangan', async ({ page }) => {
  for (const route of ['/tentang', '/tentang/area', '/tentang/kantor', '/kontak']) {
    await page.goto(base + route);
    await expect(page.locator('[data-pending-content]').first(), route).toBeVisible();
  }
});

test('filter kategori produk hanya menampilkan kategori itu', async ({ page }) => {
  await page.goto(`${base}/produk?kategori=voucher`);
  const tiles = page.locator('main ul li a[href^="/produk/"]');
  await expect(tiles).toHaveCount(1);
  await expect(tiles.first()).toContainText('Voucher Contoh 1');
  await expect(
    page.getByRole('navigation', { name: 'Kategori produk' }).locator('[aria-current="page"]'),
  ).toHaveText('Voucher');
  await page.goto(`${base}/produk?kategori=tidak-ada`);
  await expect(page.locator('main ul li a[href^="/produk/"]')).toHaveCount(5);
});

test('lowongan tutup menolak lamaran baru; form yang belum aktif tidak bisa dikirim', async ({
  page,
}) => {
  await page.goto(`${base}/karir/posisi-contoh-3/lamar`);
  await expect(page.getByText('Lowongan ini sudah ditutup')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Kirim lamaran' })).toHaveCount(0);

  await page.goto(`${base}/karir/posisi-contoh-1/lamar`);
  await expect(page.getByRole('button', { name: 'Kirim lamaran' })).toBeDisabled();
  await expect(page.getByText('Pengiriman lamaran belum aktif')).toBeVisible();
});

test('alamat yang tidak ada menghasilkan 404', async ({ page }) => {
  const response = await page.goto(`${base}/produk/tidak-ada`);
  expect(response?.status()).toBe(404);
  await expect(page.getByText('Halaman tidak ditemukan')).toBeVisible();
});

test('smartphone: menu Lainnya membuka panel, Escape menutup, fokus kembali', async ({ page }) => {
  test.skip(!isPhone(page), 'Bottom navigation hanya ada di smartphone.');
  await page.goto(base);
  const more = page.locator('[data-bottom-nav]').getByRole('button', { name: 'Lainnya' });
  await more.click();
  const dialog = page.getByRole('dialog', { name: 'Menu lainnya' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'Daftar Digipos' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(more).toBeFocused();

  await more.click();
  await dialog.getByRole('link', { name: 'Promo & Program' }).click();
  await expect(page).toHaveURL(`${base}/promo`);
  await expect(dialog).toBeHidden();
});

test('smartphone: target sentuh navigasi minimal 44 px', async ({ page }) => {
  test.skip(!isPhone(page), 'Aturan target sentuh diuji di smartphone.');
  await page.goto(base);
  const targets = page.locator(
    'nav[aria-label="Pindah aplikasi"] a, [data-bottom-nav] a, [data-bottom-nav] button',
  );
  for (const target of await targets.all()) {
    const box = await target.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
  }
});
