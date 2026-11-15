import { expect, type Page } from '@playwright/test';

export { baseUrls } from './ports';

/** <768 px dianggap smartphone (PRD 2.2). */
export function isPhone(page: Page): boolean {
  return (page.viewportSize()?.width ?? 0) < 768;
}

export function isDesktop(page: Page): boolean {
  return (page.viewportSize()?.width ?? 0) >= 1200;
}

/** Halaman tidak boleh melebar melebihi layar; tabel lebar scroll di kontainernya sendiri. */
export async function expectNoPageOverflow(page: Page, context: string) {
  const size = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(size.scrollWidth, `overflow horizontal di ${context}`).toBeLessThanOrEqual(
    size.clientWidth,
  );
}

/** Tepat satu bottom navigation di smartphone, tidak tampil di layar lebih lebar. */
export async function expectBottomNavRule(page: Page) {
  const bottomNav = page.locator('[data-bottom-nav]');
  await expect(bottomNav).toHaveCount(1);
  if (isPhone(page)) {
    await expect(bottomNav).toBeVisible();
  } else {
    await expect(bottomNav).toBeHidden();
  }
}

/** Kumpulkan error JavaScript dan error console selama pengujian. */
export function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
}

export async function expectActiveApp(page: Page, label: 'Publik' | 'Outlet' | 'Portal') {
  const active = page
    .getByRole('navigation', { name: 'Pindah aplikasi' })
    .locator('[aria-current="true"]');
  await expect(active).toHaveCount(1);
  await expect(active).toHaveText(label);
}
