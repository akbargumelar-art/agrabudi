// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { Home, Menu } from 'lucide-react';
import { afterEach, describe, expect, it } from 'vitest';
import { AppSwitcher, BottomNav, DataNotice, formatRupiah, isNavItemActive } from './index';

afterEach(cleanup);

const urls = {
  public: 'https://dev.agrabudi.test',
  outlet: 'https://dev-outlet.agrabudi.test',
  portal: 'https://dev-portal.agrabudi.test',
};

describe('AppSwitcher', () => {
  it('menandai tepat satu aplikasi aktif dan memakai URL dari environment', () => {
    render(<AppSwitcher active="outlet" urls={urls} />);
    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['Publik', 'Outlet', 'Portal']);
    const active = links.filter((link) => link.getAttribute('aria-current') === 'true');
    expect(active).toHaveLength(1);
    expect(active[0]?.textContent).toBe('Outlet');
    expect(active[0]?.className).toContain('border-brand-red');
    expect(links.map((link) => link.getAttribute('href'))).toEqual(Object.values(urls));
  });
});

describe('isNavItemActive', () => {
  it('Home hanya aktif di path yang sama', () => {
    expect(isNavItemActive({ label: 'Home', href: '/' }, '/')).toBe(true);
    expect(isNavItemActive({ label: 'Home', href: '/' }, '/karir')).toBe(false);
  });

  it('menu induk aktif di sub-halaman tanpa salah cocok pada awalan yang mirip', () => {
    const karir = { label: 'Karir', href: '/karir' };
    expect(isNavItemActive(karir, '/karir/posisi-contoh/lamar')).toBe(true);
    expect(isNavItemActive(karir, '/karir-lain')).toBe(false);
    expect(isNavItemActive(karir, '/karir/?x=1')).toBe(true);
  });

  it('menghormati alsoActiveOn', () => {
    const tentang = { label: 'Tentang Kami', href: '/tentang', alsoActiveOn: ['/kontak'] };
    expect(isNavItemActive(tentang, '/kontak')).toBe(true);
  });
});

describe('BottomNav', () => {
  it('menolak lebih dari lima item', () => {
    const items = Array.from({ length: 6 }, (_, index) => ({
      label: `Menu ${index}`,
      href: `/m${index}`,
      icon: Home,
    }));
    expect(() => render(<BottomNav items={items} currentPath="/" />)).toThrow(/lima item/);
  });

  it('menandai halaman aktif dan mendukung item tombol', () => {
    render(
      <BottomNav
        currentPath="/produk/contoh"
        items={[
          { label: 'Home', href: '/', icon: Home },
          { label: 'Produk', href: '/produk', icon: Home },
          { label: 'Lainnya', icon: Menu, onPress: () => {}, expanded: false },
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: 'Produk' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBeNull();
    expect(screen.getByRole('button', { name: 'Lainnya' }).getAttribute('aria-expanded')).toBe(
      'false',
    );
  });
});

describe('DataNotice', () => {
  it('memberi label pada data contoh dan diam pada data API', () => {
    const { rerender } = render(
      <DataNotice meta={{ source: 'mock', asOf: '2026-11-15T00:00:00Z' }} />,
    );
    expect(screen.getByText('Data contoh')).toBeTruthy();
    rerender(<DataNotice meta={{ source: 'api', asOf: '2026-11-15T00:00:00Z' }} />);
    expect(screen.queryByText('Data contoh')).toBeNull();
  });
});

describe('formatRupiah', () => {
  it('memformat integer rupiah', () => {
    expect(formatRupiah(1565000)).toBe('Rp1.565.000');
    expect(formatRupiah(0)).toBe('Rp0');
    expect(formatRupiah(Number.NaN)).toBe('Rp-');
  });
});
