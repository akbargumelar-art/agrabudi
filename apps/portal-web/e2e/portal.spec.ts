import { expect, test, type Page } from '@playwright/test';
import {
  baseUrls,
  expectActiveApp,
  expectBottomNavRule,
  expectNoPageOverflow,
  isPhone,
  trackErrors,
} from '../../../tests/e2e/helpers';
import { routeAccess } from '../src/auth/access';
import { DEMO_PASSWORD, demoAccounts } from '../src/auth/mock';
import { moduleRoutes } from '../src/registry';

const base = baseUrls.portal;

async function fillLogin(page: Page, username: string, password: string) {
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Kata sandi').fill(password);
  await page.getByRole('button', { name: 'Masuk' }).click();
}

/** Admin Web punya console sendiri; Dashboard umum mengalihkannya ke `/web-admin/dashboard`. */
const landingPath: Record<string, string> = { adminweb: '/web-admin/dashboard' };

async function signInAs(page: Page, username: string) {
  await page.goto(`${base}/login`);
  await fillLogin(page, username, DEMO_PASSWORD);
  await expect(page).toHaveURL(`${base}${landingPath[username] ?? '/'}`);
}

/** Navigasi Portal ada di sidebar; di HP sidebar dibuka dari tombol Menu. */
async function openSidebar(page: Page) {
  if (isPhone(page)) {
    await page.locator('[data-bottom-nav]').getByRole('button', { name: 'Menu' }).click();
    return page
      .getByRole('dialog', { name: 'Menu' })
      .getByRole('navigation', { name: 'Modul Portal' });
  }
  return page.getByRole('navigation', { name: 'Modul Portal' });
}

async function signOut(page: Page) {
  const sidebar = await openSidebar(page);
  await sidebar.getByRole('button', { name: 'Keluar' }).click();
  await expect(page).toHaveURL(`${base}/login`);
}

test('belum login: semua alamat dialihkan ke halaman masuk yang hanya berisi username dan kata sandi', async ({
  page,
}) => {
  const errors = trackErrors(page);
  for (const route of ['/', '/menu', '/akun', '/telkomsel/kpi/kpi-cluster', '/web-admin/banners']) {
    await page.goto(base + route);
    await expect(page, route).toHaveURL(`${base}/login`);
  }
  await expect(page.locator('h1')).toHaveText('Masuk ke Portal');
  await expectActiveApp(page, 'Portal');
  await expect(page.getByRole('img', { name: 'Agrabudi Komunika' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Menu utama' })).toHaveCount(0);
  await expect(page.locator('[data-bottom-nav]')).toHaveCount(0);
  await expectNoPageOverflow(page, '/login');

  // Tidak ada pilihan akun atau peran: hanya dua kolom dan satu tombol.
  await expect(page.locator('main input')).toHaveCount(2);
  await expect(page.locator('main button')).toHaveCount(1);
  await expect(page.locator('select')).toHaveCount(0);

  await fillLogin(page, 'manager', 'salah');
  await expect(page.getByRole('alert')).toContainText('Username atau kata sandi salah.');
  await fillLogin(page, 'tidak-ada', DEMO_PASSWORD);
  await expect(page.getByRole('alert')).toContainText('Username atau kata sandi salah.');
  await expect(page).toHaveURL(`${base}/login`);
  expect(errors).toEqual([]);
});

test('setelah masuk, pengguna kembali ke halaman yang diminta', async ({ page }) => {
  await page.goto(`${base}/telkomsel/kpi/kpi-cluster`);
  await expect(page).toHaveURL(`${base}/login`);
  await fillLogin(page, 'manager', DEMO_PASSWORD);
  await expect(page).toHaveURL(`${base}/telkomsel/kpi/kpi-cluster`);
  await expect(page.locator('h1')).toHaveText('KPI Cluster');
  await expect(page.getByTestId('hak-akses')).toHaveText('Lihat. Cakupan data: seluruh cluster.');
});

test('halaman utama setelah masuk tampil tanpa overflow dan tanpa error', async ({ page }) => {
  const errors = trackErrors(page);
  await signInAs(page, 'manager');
  for (const route of ['/', '/aktivitas', '/laporan', '/menu', '/akun']) {
    await page.goto(base + route);
    await expect(page.locator('h1'), route).toHaveCount(1);
    await expectActiveApp(page, 'Portal');
    // Tanpa menu atas. Tablet dan desktop: sidebar. HP: menu bawah melayang.
    await expect(page.getByRole('navigation', { name: 'Menu utama' })).toHaveCount(0);
    await expectBottomNavRule(page);
    if (isPhone(page)) {
      await expect(page.locator('[data-bottom-nav]')).toHaveAttribute('data-floating', '');
      await expect(
        page.getByRole('navigation', { name: 'Menu Portal' }).getByRole('button', { name: 'Menu' }),
      ).toBeVisible();
    } else {
      await expect(page.getByRole('navigation', { name: 'Modul Portal' })).toBeVisible();
    }
    await expectNoPageOverflow(page, route);
  }
  expect(errors).toEqual([]);
});

test('username menentukan peran: tiap akun membuka menunya sendiri, dan semua menu terbuka oleh minimal satu peran', async ({
  page,
}) => {
  test.setTimeout(420_000);
  const errors = trackErrors(page);
  const visited = new Set<string>();

  for (const session of demoAccounts) {
    await signInAs(page, session.username);
    const allowed = moduleRoutes.filter((route) => routeAccess(session, route) !== null);
    const denied = moduleRoutes.filter((route) => routeAccess(session, route) === null);

    for (const route of allowed) {
      if (visited.has(route.path)) continue;
      visited.add(route.path);
      await page.goto(base + route.path);
      if (route.aliasOf) {
        await expect(page, route.path).toHaveURL(base + route.aliasOf);
        continue;
      }
      await expect(page.locator('h1'), `${session.username} ${route.path}`).toHaveText(route.title);
      await expectNoPageOverflow(page, route.path);
    }

    // Menu di luar peran ditolak walau alamatnya diketik langsung.
    for (const route of [denied[0], denied[denied.length - 1]]) {
      if (!route) continue;
      await page.goto(base + route.path);
      await expect(
        page.getByText('Akses ditolak'),
        `${session.username} ${route.path}`,
      ).toBeVisible();
    }
    await signOut(page);
  }

  expect(visited.size).toBe(moduleRoutes.length);
  expect(errors).toEqual([]);
});

test('menu yang tampil mengikuti peran', async ({ page }) => {
  const main = page.getByRole('main');

  await signInAs(page, 'sfmobile');
  await page.goto(`${base}/menu`);
  await expect(main.getByRole('heading', { name: 'Telkomsel' })).toBeVisible();
  for (const hidden of ['IndiHome', 'Admin operasional', 'Website']) {
    await expect(main.getByRole('heading', { name: hidden }), hidden).toHaveCount(0);
  }
  await expect(main.getByRole('link', { name: 'Register Outlet' })).toBeVisible();
  for (const hidden of ['Fee / Komisi', 'Setting', 'User Management', 'Direct to Customer']) {
    await expect(main.getByRole('link', { name: hidden, exact: true }), hidden).toHaveCount(0);
  }
  await signOut(page);

  await signInAs(page, 'adminhousehold');
  await page.goto(`${base}/menu`);
  await expect(main.getByRole('heading', { name: 'Telkomsel' })).toHaveCount(0);
  await expect(main.getByRole('heading', { name: 'IndiHome' })).toBeVisible();
  await expect(main.getByRole('heading', { name: 'Admin operasional' })).toBeVisible();
  await expect(main.getByRole('link', { name: 'ABKShop Outlet', exact: true })).toHaveCount(0);
  await expect(main.getByRole('link', { name: 'Kelola Karir', exact: true })).toHaveCount(0);
  await signOut(page);

  // Admin Web: hanya pengaturan website, tanpa menu operasional.
  await signInAs(page, 'adminweb');
  await page.goto(`${base}/menu`);
  await expect(main.getByRole('heading', { name: 'Website' })).toBeVisible();
  for (const hidden of ['Telkomsel', 'IndiHome', 'Admin operasional']) {
    await expect(main.getByRole('heading', { name: hidden }), hidden).toHaveCount(0);
  }
  await expect(main.getByRole('link', { name: 'Banner', exact: true })).toBeVisible();
  if (isPhone(page)) {
    const bottom = page.locator('[data-bottom-nav]');
    await expect(bottom.getByRole('link', { name: 'Laporan' })).toHaveCount(0);
    await expect(bottom.getByRole('link', { name: 'Aktivitas' })).toHaveCount(0);
  }
  const nav = await openSidebar(page);
  await expect(nav.getByRole('link', { name: 'Dashboard', exact: true })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Laporan' })).toHaveCount(0);
  await expect(nav.getByRole('link', { name: 'Aktivitas' })).toHaveCount(0);
});

test('modul menampilkan data contoh berlabel dengan tabel, cari, dan detail', async ({ page }) => {
  await signInAs(page, 'adminmobile');
  await page.goto(`${base}/telkomsel/kpi/kpi-cluster`);
  await expect(page.getByTestId('hak-akses')).toHaveText('Kelola. Cakupan data: seluruh cluster.');
  await expect(page.locator('[data-mock-label]').first()).toBeVisible();
  const table = page.getByRole('table');
  await expect(table).toBeVisible();
  await expect(table.locator('tbody tr')).toHaveCount(5);

  await page.getByLabel('Cari data').fill('Aktivasi');
  await expect(table.locator('tbody tr')).toHaveCount(1);
  await table.getByRole('button', { name: 'Detail' }).click();
  const detail = page.getByRole('dialog', { name: 'Detail data' });
  await expect(detail).toContainText('Aktivasi perdana');
  await detail.getByRole('button', { name: 'Ubah' }).click();
  const form = page.getByRole('dialog', { name: 'Ubah data' });
  await form.getByLabel('Realisasi').fill('3200');
  await form.getByRole('button', { name: 'Simpan' }).click();
  await expect(form).toBeHidden();
  await expect(table.locator('tbody tr').first()).toContainText('100%');
});

test('Kelola Karir menampilkan sampel lowongan dengan tabel zebra dan navigasi keyboard', async ({
  page,
}) => {
  await signInAs(page, 'adminmobile');
  const career = `${base}/admin/kelola-karir`;
  await page.goto(`${career}/lowongan`);

  const table = page.getByRole('table');
  for (const position of [
    'Salesforce Telkomsel',
    'Direct Sales Telkomsel',
    'Salesforce IndiHome',
  ]) {
    await expect(table.getByRole('row', { name: new RegExp(position) })).toContainText('Dibuka');
  }
  const rows = table.locator('tbody tr');
  await expect(rows.nth(1)).toHaveCSS('background-color', 'rgb(247, 246, 248)');
  await expect(table.getByRole('columnheader', { name: 'Posisi' })).toHaveCSS(
    'background-color',
    'rgb(241, 239, 244)',
  );
  await expectNoPageOverflow(page, `${career}/lowongan`);

  const submenu = page.getByRole('navigation', { name: 'Submenu Kelola Karir' });
  const vacancies = submenu.getByRole('link', { name: 'Lowongan' });
  const applications = submenu.getByRole('link', { name: 'Lamaran' });
  await expect(vacancies).toHaveAttribute('aria-current', 'page');
  await vacancies.focus();
  await page.keyboard.press('Tab');
  await expect(applications).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(`${career}/lamaran`);
  await expect(applications).toHaveAttribute('aria-current', 'page');
  await expect(vacancies).not.toHaveAttribute('aria-current');
  await page.goBack();
  await expect(vacancies).toHaveAttribute('aria-current', 'page');
});

test('salesforce hanya melihat datanya sendiri dan tidak bisa mengubah', async ({ page }) => {
  await signInAs(page, 'sfmobile');
  await page.goto(`${base}/telkomsel/sellthru/st-digipos`);
  await expect(page.getByTestId('hak-akses')).toContainText('Lihat');
  const rows = page.getByRole('table').locator('tbody tr');
  await expect(rows.first()).toBeVisible();
  for (const text of await rows.allInnerTexts()) expect(text).toContain('Rizky Pratama');
  await expect(page.getByRole('button', { name: 'Tambah data' })).toHaveCount(0);
});

test('unggah CSV contoh menolak baris salah dan menyimpan sisanya', async ({ page }) => {
  await signInAs(page, 'adminmobile');
  await page.goto(`${base}/telkomsel/setting/upload-data`);
  await page.getByRole('button', { name: 'Coba dengan berkas contoh' }).click();
  const result = page.getByTestId('hasil-periksa');
  await expect(result).toContainText('3 baris siap disimpan, 2 baris ditolak');
  // ID dengan nol di depan tetap utuh.
  await expect(result).toContainText('007123');
  await page.getByRole('button', { name: 'Simpan 3 baris' }).click();
  await expect(page.getByRole('table').locator('tbody tr').first()).toContainText(
    'contoh_unggah.csv',
  );
});

test('sidebar bisa diciutkan dan dibuka lagi, dan pilihannya diingat', async ({ page }) => {
  await signInAs(page, 'adminmobile');
  await page.goto(`${base}/telkomsel/outlet/register-outlet`);
  const sidebar = page.getByRole('navigation', { name: 'Modul Portal' });

  if (isPhone(page)) {
    await expect(sidebar).toBeHidden();
    const drawer = await openSidebar(page);
    await expect(drawer.locator('[aria-current="page"]')).toHaveText('Register Outlet');
    await drawer.getByRole('link', { name: 'Stock Voucher' }).click();
    await expect(page).toHaveURL(`${base}/telkomsel/outlet/stock-voucher`);
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeHidden();
    return;
  }

  await expect(sidebar).toBeVisible();
  // Bawaan: terbuka di desktop, ciut di tablet.
  const startsCollapsed = (page.viewportSize()?.width ?? 0) < 1200;
  await expect(sidebar).toHaveAttribute('data-sidebar', startsCollapsed ? 'collapsed' : 'expanded');
  if (startsCollapsed) await sidebar.getByRole('button', { name: 'Buka sidebar' }).click();

  await expect(sidebar).toHaveAttribute('data-sidebar', 'expanded');
  await expect(sidebar.locator('[aria-current="page"]')).toHaveText('Register Outlet');
  await expect(sidebar.getByText('IndiHome', { exact: true })).toHaveCount(0);
  await expectNoPageOverflow(page, 'sidebar terbuka');

  await sidebar.getByRole('button', { name: 'Ciutkan sidebar' }).click();
  await expect(sidebar).toHaveAttribute('data-sidebar', 'collapsed');
  await expect(sidebar.getByRole('link', { name: 'Register Outlet' })).toHaveCount(0);
  await expect(sidebar.getByRole('link', { name: 'Telkomsel' })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await expectNoPageOverflow(page, 'sidebar ciut');

  await page.reload();
  await expect(sidebar).toHaveAttribute('data-sidebar', 'collapsed');
  await sidebar.getByRole('button', { name: 'Buka sidebar' }).click();
  await sidebar.getByRole('link', { name: 'Stock Voucher' }).click();
  await expect(page).toHaveURL(`${base}/telkomsel/outlet/stock-voucher`);
});

test('profil bisa diubah kecuali username', async ({ page }) => {
  await signInAs(page, 'spvmobile');
  await page.goto(`${base}/akun`);
  await expect(page.getByLabel('Username')).toBeDisabled();
  await expect(page.getByLabel('Username')).toHaveValue('spvmobile');
  await expect(page.getByTestId('profil-peran')).toHaveText('Supervisor Mobile');
  await expect(page.getByRole('button', { name: 'Simpan perubahan' })).toBeDisabled();

  // Isian salah ditolak dengan pesan per kolom, tanpa menyimpan.
  await page.getByLabel('Email').fill('bukan-email');
  await page.getByLabel('Nomor HP').fill('0812-abc');
  await page.getByRole('button', { name: 'Simpan perubahan' }).click();
  await expect(page.getByText('Format email belum benar.')).toBeVisible();
  await expect(page.getByText('Nomor HP hanya angka, 8 sampai 15 digit.')).toBeVisible();

  await page.getByLabel('Nama lengkap').fill('Nama Baru Contoh');
  await page.getByLabel('Email').fill('nama.baru@contoh.test');
  await page.getByLabel('Nomor HP').fill('081200000000');
  await page.getByRole('button', { name: 'Simpan perubahan' }).click();
  await expect(page.getByRole('status').getByText('Profil disimpan.')).toBeVisible();

  // Tersimpan: bertahan setelah refresh, dan nol di depan nomor HP tidak hilang.
  await page.reload();
  await expect(page.getByLabel('Nama lengkap')).toHaveValue('Nama Baru Contoh');
  await expect(page.getByLabel('Nomor HP')).toHaveValue('081200000000');
  await expect(page.getByLabel('Username')).toHaveValue('spvmobile');
  await expect(page.getByTestId('profil-peran')).toHaveText('Supervisor Mobile');
});

test('Admin Web tidak punya pengaturan pemesanan ABKShop Outlet (PRD 2.4)', async ({ page }) => {
  await signInAs(page, 'adminweb');
  await page.goto(`${base}/web-admin/abkshop`);
  await expect(page.getByText('Menu tidak ditemukan')).toBeVisible();
  await expect(page.getByLabel('Alamat halaman pemesanan')).toHaveCount(0);
});

test('Area Layanan: koordinat wajib berpasangan, tempel dari peta mengisi keduanya, foto dari Aset', async ({
  page,
}) => {
  await signInAs(page, 'adminweb');
  await page.goto(`${base}/web-admin/area-layanan`);
  const lat = page.getByLabel('Lintang / latitude (opsional)');
  const lng = page.getByLabel('Bujur / longitude (opsional)');
  await expect(lat).toHaveValue('');

  await lat.fill('-6.7320');
  await page.getByRole('button', { name: 'Simpan dan terbitkan' }).click();
  await expect(page.getByText('Lintang dan bujur diisi keduanya')).toBeVisible();

  await lat.fill('');
  await lat.evaluate((input) => {
    const data = new DataTransfer();
    data.setData('text/plain', '-6.7320, 108.5523');
    input.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true }));
  });
  await expect(lat).toHaveValue('-6.732');
  await expect(lng).toHaveValue('108.5523');

  const photo = page.getByLabel('Foto wilayah (opsional)');
  await photo.selectOption({ label: 'Kantor Cirebon (ilustrasi contoh)' });
  await page.getByRole('button', { name: 'Simpan dan terbitkan' }).click();
  await expect(page.getByText('Area Layanan disimpan dan tampil di website.')).toBeVisible();
  await expect(page.getByText('Periksa kembali isian yang ditandai.')).toHaveCount(0);
});

test('refresh mempertahankan sesi; keluar menghapusnya dan akun berikutnya mulai dari Dashboard', async ({
  page,
}) => {
  await signInAs(page, 'spvhousehold');
  await page.goto(`${base}/indihome/kpi`);
  await page.reload();
  await expect(page.locator('h1')).toHaveText('KPI');
  await signOut(page);
  await page.goto(`${base}/indihome/kpi`);
  await expect(page).toHaveURL(`${base}/login`);
  await page.goto(`${base}/login`);
  await fillLogin(page, 'manager', DEMO_PASSWORD);
  await expect(page.locator('h1')).toHaveText('KPI');
});
