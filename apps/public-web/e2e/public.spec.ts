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
  '/produk/perdana-internet-15gb',
  '/indihome',
  '/promo',
  '/promo/bonus-kuota-perdana-baru',
  '/digipos',
  '/karir',
  '/karir/salesforce-mobile-kota-cirebon',
  '/karir/salesforce-mobile-kota-cirebon/lamar',
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
  expect(borderColor).toBe('rgb(207, 33, 27)');

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
  // Portal selalu dibuka di halaman masuk bila belum ada sesi.
  await expect(page).toHaveURL(`${baseUrls.portal}/login`);
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

test('halaman perusahaan berisi data contoh berlabel', async ({ page }) => {
  for (const route of ['/tentang', '/tentang/area', '/tentang/kantor', '/kontak']) {
    await page.goto(base + route);
    await expect(page.locator('[data-mock-label]').first(), route).toBeVisible();
  }
  await page.goto(`${base}/tentang/area`);
  await expect(page.getByRole('main')).toContainText('Kabupaten Kuningan');
});

test('filter kategori produk hanya menampilkan kategori itu', async ({ page }) => {
  await page.goto(`${base}/produk?kategori=voucher`);
  const tiles = page.locator('main ul li a[href^="/produk/"]');
  await expect(tiles).toHaveCount(2);
  await expect(tiles.first()).toContainText('Voucher Data');
  await expect(
    page.getByRole('navigation', { name: 'Kategori produk' }).locator('[aria-current="page"]'),
  ).toHaveText('Voucher');
  await page.goto(`${base}/produk?kategori=tidak-ada`);
  await expect(page.locator('main ul li a[href^="/produk/"]')).toHaveCount(8);
});

test('lowongan tutup menolak lamaran; form lamaran memeriksa isian lalu memberi nomor referensi', async ({
  page,
}) => {
  await page.goto(`${base}/karir/supervisor-direct-sales/lamar`);
  await expect(page.getByText('Lowongan ini sudah ditutup')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Kirim lamaran' })).toHaveCount(0);

  await page.goto(`${base}/karir/salesforce-mobile-kota-cirebon/lamar`);
  await page.getByRole('button', { name: 'Kirim lamaran' }).click();
  await expect(page.locator('[data-demo-success]')).toHaveCount(0);

  await page.getByLabel('Nama lengkap').fill('Pelamar Uji');
  await page.getByLabel('Email').fill('pelamar@contoh.test');
  await page.getByLabel('Nomor HP').fill('081234567890');
  await page.getByLabel('CV').setInputFiles({
    name: 'cv.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 contoh'),
  });
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Kirim lamaran' }).click();
  await expect(page.locator('[data-demo-success]')).toBeVisible();
  await expect(page.locator('[data-demo-reference]')).toHaveText(/^LMR-\d{6}-\d{4}$/);
});

test('footer menempel di dasar layar walau isi halaman pendek', async ({ page }) => {
  // Daftar kosong (mode API tanpa data) dan 404 adalah halaman terpendek.
  for (const route of ['/promo', '/karir', '/produk/tidak-ada', ...routes]) {
    await page.goto(base + route);
    const layout = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      const wrapper = footer?.parentElement;
      if (!footer || !wrapper) return null;
      return {
        footerBottom: footer.getBoundingClientRect().bottom + window.scrollY,
        offset: Number.parseFloat(getComputedStyle(wrapper).paddingBottom),
        documentHeight: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight,
      };
    });
    expect(layout, route).not.toBeNull();
    if (!layout) continue;
    expect(layout.documentHeight, route).toBeGreaterThanOrEqual(layout.viewportHeight);
    // Di bawah footer hanya boleh ada ruang untuk bottom navigation (HP).
    expect(
      Math.abs(layout.documentHeight - layout.offset - layout.footerBottom),
      route,
    ).toBeLessThanOrEqual(1);
  }
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

test('menu utama yang tidak muat digeser dengan panah, tanpa scrollbar', async ({ page }) => {
  test.skip(isPhone(page), 'Menu utama hanya tampil dari lebar tablet.');
  await page.goto(base);
  const nav = page.getByRole('navigation', { name: 'Menu utama' });
  const track = nav.locator('ul');
  const prev = nav.getByRole('button', { name: 'Geser menu ke kiri' });
  const next = nav.getByRole('button', { name: 'Geser menu ke kanan' });

  expect(await track.evaluate((element) => getComputedStyle(element).scrollbarWidth)).toBe('none');
  const overflows = await track.evaluate(
    (element) => element.scrollWidth > element.clientWidth + 1,
  );
  if (!overflows) {
    await expect(prev).toBeHidden();
    await expect(next).toBeHidden();
    return;
  }

  // Panah hanya ada di sisi yang masih punya menu tersembunyi.
  await expect(prev).toBeHidden();
  await expect(next).toBeVisible();
  await next.click();
  await expect(prev).toBeVisible();
  await expect.poll(() => track.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  await expectNoPageOverflow(page, 'menu utama digeser');

  // Menu aktif digeser ke dalam pandangan saat halamannya dibuka.
  await page.goto(`${base}/karir`);
  await expect(nav.locator('[aria-current="page"]')).toBeInViewport();
});
