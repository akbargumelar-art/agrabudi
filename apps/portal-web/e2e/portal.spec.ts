import { expect, test, type Page } from '@playwright/test';
import {
  baseUrls,
  expectActiveApp,
  expectBottomNavRule,
  expectNoPageOverflow,
  isDesktop,
  isPhone,
  trackErrors,
} from '../../../tests/e2e/helpers';
import { roleLabel, routeAccess } from '../src/auth/access';
import { mockAuthAdapter } from '../src/auth/mock';
import { moduleRoutes } from '../src/registry';

const base = baseUrls.portal;
const accounts = mockAuthAdapter.demoAccounts.map((item) => item.session);

async function signInAs(page: Page, label: string) {
  await page.goto(`${base}/login`);
  await page.getByRole('button', { name: new RegExp(`^${label}\\b`) }).click();
  await expect(page).toHaveURL(`${base}/`);
}

async function signOut(page: Page) {
  await page.getByRole('button', { name: 'Keluar' }).first().click();
  await expect(page).toHaveURL(`${base}/login`);
}

test('belum login: semua alamat dialihkan ke halaman masuk', async ({ page }) => {
  const errors = trackErrors(page);
  for (const route of [
    '/',
    '/menu',
    '/akun',
    '/telkomsel/kpi/kpi-cluster',
    '/admin/abkshop-outlet/order',
  ]) {
    await page.goto(base + route);
    await expect(page, route).toHaveURL(`${base}/login`);
  }
  await expect(page.locator('h1')).toHaveText('Masuk ke Portal');
  await expectActiveApp(page, 'Portal');
  await expect(page.getByRole('navigation', { name: 'Menu utama' })).toHaveCount(0);
  await expect(page.locator('[data-bottom-nav]')).toHaveCount(0);
  await expect(page.locator('[data-stage-notice]')).toBeVisible();
  await expectNoPageOverflow(page, '/login');

  // Akun contoh berlabel; Administrator Web tidak ditawarkan di login Portal.
  await expect(page.locator('[data-mock-label]')).toBeVisible();
  await expect(
    page.getByRole('button', { name: /^(Admin|Manager|Supervisor|Salesforce)/ }),
  ).toHaveCount(8);
  await expect(page.locator('body')).not.toContainText('Administrator Web');
  await expect(page.locator('a[href*="web-admin"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('setelah masuk, pengguna kembali ke halaman yang diminta', async ({ page }) => {
  await page.goto(`${base}/telkomsel/kpi/kpi-cluster`);
  await expect(page).toHaveURL(`${base}/login`);
  await page.getByRole('button', { name: /^Manager\b/ }).click();
  await expect(page).toHaveURL(`${base}/telkomsel/kpi/kpi-cluster`);
  await expect(page.locator('h1')).toHaveText('KPI Cluster');
  await expect(page.getByTestId('hak-akses')).toHaveText('Lihat. Cakupan data: seluruh cluster.');
});

test('halaman utama setelah masuk tampil tanpa overflow dan tanpa error', async ({ page }) => {
  const errors = trackErrors(page);
  await signInAs(page, 'Manager');
  for (const route of ['/', '/aktivitas', '/laporan', '/menu', '/akun']) {
    await page.goto(base + route);
    await expect(page.locator('h1'), route).toHaveCount(1);
    await expectActiveApp(page, 'Portal');
    await expectBottomNavRule(page);
    await expectNoPageOverflow(page, route);
  }
  expect(errors).toEqual([]);
});

test('tiap peran membuka menunya sendiri; semua modul PRD 2.8-2.10 terbuka oleh minimal satu peran', async ({
  page,
}) => {
  test.setTimeout(360_000);
  const errors = trackErrors(page);
  const visited = new Set<string>();

  for (const session of accounts) {
    await signInAs(page, roleLabel(session));
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
      await expect(page.locator('h1'), `${session.accountId} ${route.path}`).toHaveText(
        route.title,
      );
      await expectNoPageOverflow(page, route.path);
    }

    // Menu di luar peran ditolak walau alamatnya diketik langsung.
    for (const route of [denied[0], denied[denied.length - 1]]) {
      if (!route) continue;
      await page.goto(base + route.path);
      await expect(
        page.getByText('Akses ditolak'),
        `${session.accountId} ${route.path}`,
      ).toBeVisible();
    }
    await signOut(page);
  }

  expect(visited.size).toBe(moduleRoutes.length);
  expect(errors).toEqual([]);
});

test('menu yang tampil mengikuti peran', async ({ page }) => {
  await signInAs(page, 'Salesforce Mobile');
  if (!isPhone(page)) {
    await expect(page.getByTestId('peran-aktif')).toContainText('Salesforce Mobile');
  }
  await page.goto(`${base}/menu`);
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { name: 'Telkomsel' })).toBeVisible();
  await expect(main.getByRole('heading', { name: 'IndiHome' })).toHaveCount(0);
  await expect(main.getByRole('heading', { name: 'Admin operasional' })).toHaveCount(0);
  await expect(main.getByRole('link', { name: 'Register Outlet' })).toBeVisible();
  for (const hidden of ['Fee / Komisi', 'Setting', 'User Management', 'Direct to Customer']) {
    await expect(main.getByRole('link', { name: hidden, exact: true }), hidden).toHaveCount(0);
  }
  await page.goto(`${base}/akun`);
  await expect(page.getByRole('main')).toContainText('Data Anda sendiri');
  await signOut(page);

  await signInAs(page, 'Admin Household');
  await page.goto(`${base}/menu`);
  await expect(main.getByRole('heading', { name: 'Telkomsel' })).toHaveCount(0);
  await expect(main.getByRole('heading', { name: 'IndiHome' })).toBeVisible();
  await expect(main.getByRole('heading', { name: 'Admin operasional' })).toBeVisible();
  await expect(main.getByRole('link', { name: 'ABKShop Outlet', exact: true })).toHaveCount(0);
  await expect(main.getByRole('link', { name: 'Kelola Karir', exact: true })).toHaveCount(0);
});

test('modul kerangka tidak menampilkan angka contoh', async ({ page }) => {
  await signInAs(page, 'Admin Mobile');
  await page.goto(`${base}/telkomsel/kpi/kpi-cluster`);
  await expect(page.getByText('Kerangka', { exact: true })).toBeVisible();
  await expect(page.getByTestId('hak-akses')).toHaveText('Kelola. Cakupan data: seluruh cluster.');
  await expect(page.getByText('Belum ada data untuk ditampilkan')).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText('Rp');
  await expect(page.locator('main')).not.toContainText('%');
});

test('sidebar hanya di desktop; di layar lain modul dibuka dari Semua Menu', async ({ page }) => {
  await signInAs(page, 'Admin Mobile');
  await page.goto(`${base}/telkomsel/outlet/register-outlet`);
  const sidebar = page.getByRole('navigation', { name: 'Modul Portal' });
  if (isDesktop(page)) {
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator('[aria-current="page"]')).toHaveText('Register Outlet');
    await expect(sidebar.getByText('IndiHome', { exact: true })).toHaveCount(0);
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

test('refresh mempertahankan sesi; keluar menghapusnya', async ({ page }) => {
  await signInAs(page, 'Supervisor Household');
  await page.goto(`${base}/indihome/kpi`);
  await page.reload();
  await expect(page.locator('h1')).toHaveText('KPI');
  await signOut(page);
  await page.goto(`${base}/indihome/kpi`);
  await expect(page).toHaveURL(`${base}/login`);
});
