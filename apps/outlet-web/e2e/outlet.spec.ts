import { expect, test, type Page } from '@playwright/test';
import {
  baseUrls,
  expectActiveApp,
  expectBottomNavRule,
  expectNoPageOverflow,
  isPhone,
  trackErrors,
} from '../../../tests/e2e/helpers';

const base = baseUrls.outlet;

/** Seluruh route Outlet dari PRD 2.7. */
const routes = [
  '/',
  '/login',
  '/lupa-akses',
  '/kalkulator',
  '/abkshop',
  '/checkout',
  '/pesanan',
  '/pesanan/order-contoh-2',
  '/program',
  '/program/program-mitra-contoh-1',
  '/akun',
];

function qty(page: Page, name: string) {
  return page.getByRole('textbox', { name: `Jumlah ${name}` });
}

test('semua route Outlet tampil tanpa overflow dan tanpa error, termasuk lewat deep link', async ({
  page,
}) => {
  const errors = trackErrors(page);
  for (const route of routes) {
    await page.goto(base + route);
    await expect(page.locator('h1'), route).toHaveCount(1);
    await expect(page.locator('h1'), route).toBeVisible();
    await expectActiveApp(page, 'Outlet');
    await expectBottomNavRule(page);
    await expectNoPageOverflow(page, route);
  }
  expect(errors).toEqual([]);
});

test('tabel ABKShop memuat kolom wajib dan scroll di kontainernya sendiri', async ({ page }) => {
  await page.goto(`${base}/abkshop`);
  const table = page.getByRole('table');
  for (const column of [
    'Foto',
    'Nama paket',
    'Deskripsi dan isi',
    'Harga per paket',
    'Jumlah beli',
    'Subtotal',
  ]) {
    await expect(table.getByRole('columnheader', { name: column })).toHaveCount(1);
  }
  await expect(page.locator('[data-mock-label]')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Foto Paket Contoh A belum tersedia' })).toBeVisible();

  if (isPhone(page)) {
    const region = page.locator('[data-table-scroll]');
    const size = await region.evaluate((element) => ({
      scroll: element.scrollWidth,
      client: element.clientWidth,
    }));
    expect(size.scroll).toBeGreaterThan(size.client);
    await expect(
      page.getByText('Geser tabel ke samping untuk melihat harga dan jumlah.'),
    ).toBeVisible();
    await expectNoPageOverflow(page, '/abkshop');
  }
});

test('US-05: 2 x Rp420.000 + 1 x Rp725.000 = Rp1.565.000, filter tidak mengubah total', async ({
  page,
}) => {
  await page.goto(`${base}/abkshop`);
  await expect(page.getByRole('button', { name: 'Checkout' })).toBeDisabled();

  await qty(page, 'Paket Contoh A').fill('2');
  await qty(page, 'Paket Contoh B').fill('1');
  await expect(page.getByTestId('subtotal-paket-contoh-a')).toHaveText('Rp840.000');
  await expect(page.getByTestId('jenis-paket')).toHaveText('2');
  await expect(page.getByTestId('total-paket')).toHaveText('3');
  await expect(page.getByTestId('total-estimasi')).toHaveText('Rp1.565.000');

  // Filter menyembunyikan kedua paket terpilih; total dan pilihan tetap.
  await page.getByLabel('Kategori').selectOption({ label: 'Kategori Contoh 2' });
  await expect(qty(page, 'Paket Contoh A')).toHaveCount(0);
  await expect(page.getByTestId('hidden-selected')).toContainText('2 paket terpilih tidak tampil');
  await expect(page.getByTestId('total-estimasi')).toHaveText('Rp1.565.000');

  await page.getByLabel('Cari paket').fill('tidak ada yang cocok');
  await expect(page.getByText('Tidak ada paket yang cocok')).toBeVisible();
  await expect(page.getByTestId('total-estimasi')).toHaveText('Rp1.565.000');
  await page.getByRole('button', { name: 'Hapus filter' }).click();
  await expect(qty(page, 'Paket Contoh A')).toHaveValue('2');

  // Checkout: total sama, order belum bisa diajukan, pilihan bertahan setelah refresh.
  await page.getByRole('link', { name: 'Checkout' }).click();
  await expect(page).toHaveURL(`${base}/checkout`);
  await expect(page.getByTestId('checkout-total')).toHaveText('Rp1.565.000');
  await expect(page.getByRole('button', { name: 'Ajukan order' })).toBeDisabled();
  await expect(page.getByText('Pengajuan order belum aktif')).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('checkout-total')).toHaveText('Rp1.565.000');
  await page.goBack();
  await expect(qty(page, 'Paket Contoh B')).toHaveValue('1');
});

test('jumlah tidak valid ditandai, tidak dijumlahkan, dan memblokir checkout', async ({ page }) => {
  await page.goto(`${base}/abkshop`);
  await qty(page, 'Paket Contoh A').fill('2');

  for (const bad of ['-1', '1.5', 'abc', '99']) {
    await qty(page, 'Paket Contoh B').fill(bad);
    await expect(qty(page, 'Paket Contoh B')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByTestId('total-estimasi')).toHaveText('Rp840.000');
    await expect(page.getByRole('button', { name: 'Checkout' })).toBeDisabled();
    await expect(page.getByText('Perbaiki jumlah yang ditandai merah')).toBeVisible();
  }
  await expect(page.locator('body')).not.toContainText('NaN');

  // Aturan paket: minimum 2 dan kelipatan 2.
  await qty(page, 'Paket Contoh B').fill('');
  await qty(page, 'Paket Contoh C').fill('3');
  await expect(page.getByText('Harus kelipatan 2.')).toBeVisible();
  await qty(page, 'Paket Contoh C').fill('');
  await page.getByRole('button', { name: 'Tambah jumlah Paket Contoh C' }).click();
  await expect(qty(page, 'Paket Contoh C')).toHaveValue('2');
  await expect(page.getByRole('link', { name: 'Checkout' })).toBeVisible();

  await page.getByRole('button', { name: 'Kosongkan semua jumlah' }).click();
  await expect(page.getByRole('status').getByText('Semua jumlah dikosongkan.')).toBeVisible();
  await expect(page.getByTestId('total-estimasi')).toHaveText('Rp0');
  await expect(page.getByRole('button', { name: 'Checkout' })).toBeDisabled();
});

test('checkout dengan keranjang kosong ditolak', async ({ page }) => {
  await page.goto(`${base}/checkout`);
  await expect(page.getByText('Belum ada paket yang dipilih')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ajukan order' })).toHaveCount(0);
});

test('status order dan status pembayaran tampil terpisah', async ({ page }) => {
  await page.goto(`${base}/pesanan/order-contoh-2`);
  await expect(page.getByText('Diajukan', { exact: true })).toBeVisible();
  await expect(page.getByText('Belum ditagih', { exact: true })).toBeVisible();
  await expect(page.getByText('Rp1.565.000').first()).toBeVisible();

  await page.goto(`${base}/pesanan/tidak-ada`);
  await expect(page.getByText('Pesanan tidak ditemukan')).toBeVisible();
});

test('aksi yang belum ada dinonaktifkan dengan alasan, bukan sukses palsu', async ({ page }) => {
  await page.goto(`${base}/login`);
  await expect(page.getByRole('button', { name: 'Masuk' })).toBeDisabled();
  await expect(page.getByText('Login outlet belum aktif')).toBeVisible();
  await page.goto(`${base}/kalkulator`);
  await expect(page.getByRole('button', { name: 'Hitung simulasi' })).toBeDisabled();
  await expect(page.getByText('Rumus belum disahkan')).toBeVisible();
});

test('menu aktif mengikuti halaman', async ({ page }) => {
  await page.goto(`${base}/checkout`);
  const nav = isPhone(page)
    ? page.locator('[data-bottom-nav]')
    : page.getByRole('navigation', { name: 'Menu utama' });
  await expect(nav.locator('[aria-current="page"]')).toHaveText('ABKShop');
});
