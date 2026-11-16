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
const EMBED_URL = 'https://order.agrabudi.com/';

const routes = [
  '/',
  '/login',
  '/lupa-akses',
  '/kalkulator',
  '/abkshop',
  '/program',
  '/program/target-perdana-november',
  '/akun',
];

/** Halaman pemesanan pihak luar digantikan halaman tiruan supaya tes tidak bergantung pada Internet. */
async function stubEmbed(page: Page) {
  await page.route('https://order.agrabudi.com/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><title>Form Order</title><h1>Halaman pemesanan tiruan</h1>',
    }),
  );
}

test.beforeEach(async ({ page }) => {
  await stubEmbed(page);
});

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
  await expect(page.getByRole('img', { name: 'Agrabudi Komunika' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('ABKShop menyematkan halaman pemesanan dan selalu menyediakan tautan tab baru', async ({
  page,
}) => {
  await page.goto(`${base}/abkshop`);
  const frame = page.getByTestId('abkshop-embed');
  await expect(frame).toHaveAttribute('src', EMBED_URL);
  await expect(frame).toHaveAttribute('title', 'Halaman pemesanan ABKShop');
  await expect(page.frameLocator('[data-testid="abkshop-embed"]').locator('h1')).toHaveText(
    'Halaman pemesanan tiruan',
  );
  const newTab = page.getByRole('link', { name: 'Buka di tab baru' });
  await expect(newTab).toHaveAttribute('href', EMBED_URL);
  await expect(newTab).toHaveAttribute('target', '_blank');
  await expectNoPageOverflow(page, '/abkshop');
});

test('Pesanan dan Checkout tidak ada lagi di Outlet', async ({ page }) => {
  await page.goto(base);
  const nav = isPhone(page)
    ? page.locator('[data-bottom-nav]')
    : page.getByRole('navigation', { name: 'Menu utama' });
  await expect(nav.getByRole('link', { name: 'Pesanan' })).toHaveCount(0);
  await expect(page.locator('a[href="/pesanan"], a[href="/checkout"]')).toHaveCount(0);
  for (const route of ['/pesanan', '/checkout']) {
    await page.goto(base + route);
    await expect(page.getByText('Halaman tidak ditemukan'), route).toBeVisible();
  }
});

test('mitra outlet masuk dengan ID Digipos dan kata sandi', async ({ page }) => {
  await page.goto(`${base}/login`);
  await page.getByLabel('ID Digipos').fill('CONTOH001');
  await page.getByLabel('Kata sandi').fill('salah');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.getByRole('alert')).toContainText('ID Digipos atau kata sandi salah.');

  await page.getByLabel('Kata sandi').fill('contoh123');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page).toHaveURL(`${base}/`);
  if (!isPhone(page)) {
    await expect(page.getByTestId('akun-outlet')).toHaveText('Cell Berkah Jaya');
  }
  await page.goto(`${base}/akun`);
  await expect(page.getByRole('main')).toContainText('CONTOH001');
  await expect(page.getByRole('main')).toContainText('Cell Berkah Jaya');
  // Profil contoh: foto toko dan program yang diikuti.
  await expect(page.getByRole('main')).toContainText('Target Perdana November');
  await page.getByRole('button', { name: 'Keluar' }).click();
  await expect(page.getByText('Anda belum masuk')).toBeVisible();
});

test('slider pemenang program: kartu, detail penyerahan, dan tombol jeda', async ({ page }) => {
  await page.goto(base);
  const slider = page.getByRole('group', { name: 'Pemenang program' });
  await expect(slider.getByRole('button')).not.toHaveCount(0);
  await expect(slider.locator('img').first()).toBeVisible();
  await expect(page.locator('[data-mock-label]').first()).toBeVisible();

  // Geser otomatis selalu bisa dijeda.
  await slider.getByRole('button', { name: 'Pemenang program: jeda geser otomatis' }).click();
  await expect(
    slider.getByRole('button', { name: 'Pemenang program: lanjutkan geser otomatis' }),
  ).toHaveAttribute('aria-pressed', 'true');

  await slider.getByRole('button', { name: /Cell Berkah Jaya/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Penyerahan Kulkas Mini' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Outlet Rapi dengan Materi Promosi');
  await expect(dialog).toContainText('TAP Kota Cirebon');
  // Koordinat lokasi dan nama petugas tidak ditampilkan ke sesama mitra.
  await expect(dialog).not.toContainText(/koordinat|surveyor|lokasi/i);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expectNoPageOverflow(page, '/ setelah slider');
});

test('kalkulator cuan: rekomendasi dan pilih sendiri mengikuti modal', async ({ page }) => {
  await page.goto(`${base}/kalkulator`);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Kalkulator Cuan');
  await expect(page.getByText('Masukkan modal awal')).toBeVisible();

  await page.getByLabel('Modal awal (Rp)').fill('100000');
  await expect(page.getByLabel('Modal awal (Rp)')).toHaveValue('100.000');
  await expect(page.locator('[data-mock-label]').first()).toBeVisible();

  await page.getByRole('button', { name: 'Hitungkan cuan maksimal' }).click();
  const result = page.getByTestId('hasil-rekomendasi');
  await expect(result.locator('li').first()).toBeVisible();
  // Modal terpakai tidak boleh melebihi modal awal.
  const used = Number((await page.getByTestId('modal-terpakai').innerText()).replace(/\D/g, ''));
  expect(used).toBeGreaterThan(0);
  expect(used).toBeLessThanOrEqual(100000);
  await expect(page.getByTestId('total-cuan')).toContainText('Rp');

  await page.getByRole('button', { name: 'Pilih Sendiri' }).click();
  await page.getByLabel('Cari produk').fill('Perdana Orbit 50GB');
  await page.getByRole('button', { name: 'Pilih Perdana Orbit 50GB Telkomsel Orbit' }).click();
  await expect(page.getByTestId('modal-terpakai')).toContainText('80.000');
  await expect(page.getByTestId('sisa-modal')).toContainText('20.000');
  // Untung = 120.000 - 80.000 + cashback 7.000.
  await expect(page.getByTestId('total-cuan')).toContainText('47.000');
  // Sisa modal 20.000 tidak cukup untuk satu unit lagi.
  await expect(page.getByRole('button', { name: 'Tambah Perdana Orbit 50GB Telkomsel Orbit' })).toBeDisabled();
});

test('aksi yang belum ada dinonaktifkan dengan alasan, bukan sukses palsu', async ({ page }) => {
  await page.goto(`${base}/lupa-akses`);
  await expect(page.getByRole('button', { name: 'Kirim petunjuk pemulihan' })).toBeDisabled();
});

test('menu aktif mengikuti halaman', async ({ page }) => {
  await page.goto(`${base}/abkshop`);
  const nav = isPhone(page)
    ? page.locator('[data-bottom-nav]')
    : page.getByRole('navigation', { name: 'Menu utama' });
  await expect(nav.locator('[aria-current="page"]')).toHaveText('ABKShop');
});
