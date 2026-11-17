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
  '/program/target-perdana-november',
  '/akun',
];

/** Halaman yang hanya untuk mitra yang sudah masuk. */
const memberRoutes = ['/abkshop', '/checkout', '/pesanan', '/pesanan/order-contoh-2'];

function qty(page: Page, name: string) {
  return page.getByRole('textbox', { name: `Jumlah ${name}` });
}

/** Masuk lewat form, seperti pengguna. Akun contoh hanya ada di build mock. */
async function signIn(page: Page, digiposId = 'CONTOH001') {
  await page.goto(`${base}/login`);
  await page.getByLabel('ID Digipos').fill(digiposId);
  await page.getByLabel('Kata sandi').fill('contoh123');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page).toHaveURL(`${base}/`);
}

test('semua route Outlet tampil tanpa overflow dan tanpa error, termasuk lewat deep link', async ({
  page,
}) => {
  const errors = trackErrors(page);
  const visitAll = async (list: string[]) => {
    for (const route of list) {
      await page.goto(base + route);
      await expect(page.locator('h1'), route).toHaveCount(1);
      await expect(page.locator('h1'), route).toBeVisible();
      await expectActiveApp(page, 'Outlet');
      await expectBottomNavRule(page);
      await expectNoPageOverflow(page, route);
    }
  };
  await visitAll(routes);
  await expect(page.getByRole('img', { name: 'Agrabudi Komunika' })).toBeVisible();
  await signIn(page);
  await visitAll(memberRoutes);
  expect(errors).toEqual([]);
});

test('ABKShop, checkout, dan pesanan meminta login lalu kembali ke halaman asal', async ({
  page,
}) => {
  for (const route of memberRoutes) {
    await page.goto(base + route);
    await expect(page.getByText('Masuk dulu untuk melanjutkan'), route).toBeVisible();
    await expect(page.getByRole('table'), route).toHaveCount(0);
  }
  await page.goto(`${base}/pesanan`);
  await page.getByRole('link', { name: 'Masuk dengan ID Digipos' }).click();
  await page.getByLabel('ID Digipos').fill('CONTOH001');
  await page.getByLabel('Kata sandi').fill('contoh123');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page).toHaveURL(`${base}/pesanan`);
  await expect(page.getByRole('link', { name: 'CONTOH-0002' })).toBeVisible();
});

test('tabel ABKShop memuat kolom wajib dan scroll di kontainernya sendiri', async ({ page }) => {
  await signIn(page);
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
  await signIn(page);
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

  // Checkout: total sama, pilihan bertahan setelah refresh.
  await page.getByRole('link', { name: 'Checkout' }).click();
  await expect(page).toHaveURL(`${base}/checkout`);
  await expect(page.getByTestId('checkout-total')).toHaveText('Rp1.565.000');
  await page.reload();
  await expect(page.getByTestId('checkout-total')).toHaveText('Rp1.565.000');
  await page.goBack();
  await expect(qty(page, 'Paket Contoh B')).toHaveValue('1');
});

test('US-06: harga final dulu, baru order diajukan; keranjang dikosongkan setelah tersimpan', async ({
  page,
}) => {
  await signIn(page);
  await page.goto(`${base}/abkshop`);
  await qty(page, 'Paket Contoh A').fill('2');
  await qty(page, 'Paket Contoh B').fill('1');
  await page.getByRole('link', { name: 'Checkout' }).click();

  // Belum ada quote: tombol ajukan belum muncul.
  await expect(page.getByRole('button', { name: 'Ajukan order' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Periksa harga final' }).click();
  await expect(page.getByTestId('quote-total')).toHaveText('Rp1.565.000');

  await page.getByRole('button', { name: 'Ajukan order' }).click();
  await expect(page).toHaveURL(new RegExp(`^${base}/pesanan/`));
  await expect(page.getByText('Order diajukan.')).toBeVisible();
  await expect(page.getByText('Belum ditagih')).toBeVisible();

  await page.goto(`${base}/abkshop`);
  await expect(page.getByTestId('total-estimasi')).toHaveText('Rp0');
});

test('jumlah tidak valid ditandai, tidak dijumlahkan, dan memblokir checkout', async ({ page }) => {
  await signIn(page);
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
  await signIn(page);
  await page.goto(`${base}/checkout`);
  await expect(page.getByText('Belum ada paket yang dipilih')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ajukan order' })).toHaveCount(0);
});

test('status order dan status pembayaran tampil terpisah', async ({ page }) => {
  await signIn(page);
  await page.goto(`${base}/pesanan/order-contoh-2`);
  await expect(page.getByText('Diajukan', { exact: true })).toBeVisible();
  await expect(page.getByText('Belum ditagih', { exact: true })).toBeVisible();
  await expect(page.getByText('Rp1.565.000').first()).toBeVisible();

  await page.goto(`${base}/pesanan/tidak-ada`);
  await expect(page.getByText('Pesanan tidak ditemukan')).toBeVisible();
});

test('outlet hanya melihat pesanan dan keranjangnya sendiri', async ({ page }) => {
  await signIn(page, 'CONTOH001');
  await page.goto(`${base}/abkshop`);
  await qty(page, 'Paket Contoh A').fill('2');
  await page.goto(`${base}/akun`);
  await page.getByRole('button', { name: 'Keluar' }).click();

  await signIn(page, 'CONTOH002');
  await page.goto(`${base}/pesanan`);
  await expect(page.getByRole('link', { name: 'CONTOH-0003' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'CONTOH-0002' })).toHaveCount(0);
  // Pesanan outlet lain lewat deep link diperlakukan sebagai tidak ada.
  await page.goto(`${base}/pesanan/order-contoh-2`);
  await expect(page.getByText('Pesanan tidak ditemukan')).toBeVisible();
  // Keranjang outlet sebelumnya tidak terbawa.
  await page.goto(`${base}/abkshop`);
  await expect(qty(page, 'Paket Contoh A')).toHaveValue('');
  await expect(page.getByTestId('total-estimasi')).toHaveText('Rp0');
});

test('outlet tanpa pesanan melihat keadaan kosong', async ({ page }) => {
  await signIn(page, 'CONTOH003');
  await page.goto(`${base}/pesanan`);
  await expect(page.getByText('Belum ada pesanan')).toBeVisible();
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
  await expect(
    page.getByRole('button', { name: 'Tambah Perdana Orbit 50GB Telkomsel Orbit' }),
  ).toBeDisabled();
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
