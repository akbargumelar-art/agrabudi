import { describe, expect, it } from 'vitest';
import { consolePages } from '../console/ConsolePage';
import { findModuleRoute, findSection, moduleRoutes, sections } from './index';

describe('route registry Portal', () => {
  it('tidak punya path ganda', () => {
    const paths = moduleRoutes.map((route) => route.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('memuat seluruh menu PRD 2.8-2.10', () => {
    const count = (id: string) => moduleRoutes.filter((route) => route.section.id === id).length;
    // 17 menu + 42 submenu Telkomsel; 13 menu + 12 submenu IndiHome; 9 kelompok + 40 menu Admin.
    // Syarat dan kolom form Daftar Digipos pindah ke Admin Web (teks halaman Publik).
    expect(count('telkomsel')).toBe(59);
    expect(count('indihome')).toBe(25);
    expect(count('admin')).toBe(49);
  });

  it('semua alias menunjuk ke modul yang ada dan bukan alias lagi', () => {
    const aliases = moduleRoutes.filter((route) => route.aliasOf);
    expect(aliases.length).toBeGreaterThan(0);
    for (const alias of aliases) {
      const target = findModuleRoute(alias.aliasOf ?? '');
      expect(target, alias.path).toBeDefined();
      expect(target?.aliasOf).toBeUndefined();
    }
  });

  it('halaman awal tiap bagian terdaftar', () => {
    for (const section of sections) {
      expect(findModuleRoute(section.home), section.home).toBeDefined();
    }
  });

  it('bagian Website berada di /web-admin dan tiap menunya punya halaman', () => {
    const website = moduleRoutes.filter((route) => route.section.id === 'website');
    // Sembilan menu PRD 2.3, ditambah editor per halaman institusional dan WA Gateway.
    // Pemesanan Outlet bukan urusan Admin Web (PRD 2.4).
    expect(website).toHaveLength(15);
    expect(website.every((route) => route.path.startsWith('/web-admin/'))).toBe(true);
    expect(Object.keys(consolePages).sort()).toEqual(
      website.map((route) => route.group.slug).sort(),
    );
    expect(findSection('/web-admin')?.id).toBe('website');
  });

  it('mengenali bagian dari path dan mengabaikan garis miring di akhir', () => {
    expect(findSection('/telkomsel/outlet/register-outlet')?.id).toBe('telkomsel');
    expect(findModuleRoute('/indihome/kpi/')?.title).toBe('KPI');
    expect(findSection('/telkomsel-lain')).toBeUndefined();
  });
});
