import type { StaffSession } from '@agrabudi/contracts';
import { describe, expect, it } from 'vitest';
import { moduleRoutes, sections } from '../registry';
import {
  adminGroupRuleSlugs,
  groupAccess,
  roleLabel,
  routeAccess,
  visibleSections,
} from './access';
import { demoAccounts } from './mock';

const accounts = demoAccounts;
const byId = (id: string): StaffSession => {
  const found = accounts.find((session) => session.accountId === id);
  if (!found) throw new Error(`akun contoh ${id} tidak ada`);
  return found;
};

const adminWeb = byId('contoh-adminweb');
const adminMobile = byId('contoh-adminmobile');
const adminHousehold = byId('contoh-adminhousehold');
const manager = byId('contoh-manager');
const supervisorMobile = byId('contoh-spvmobile');
const supervisorHousehold = byId('contoh-spvhousehold');
const salesMobile = byId('contoh-sfmobile');
const salesHousehold = byId('contoh-sfhousehold');
const salesDirect = byId('contoh-sfdirect');

describe('aturan akses menu Portal', () => {
  it('Admin Web hanya mengatur website, dan hanya Admin Web yang boleh mengaturnya', () => {
    expect(visibleSections(adminWeb).map((item) => item.section.id)).toEqual(['website']);
    const modes = moduleRoutes
      .filter((route) => route.section.id !== 'website')
      .map((route) => routeAccess(adminWeb, route));
    expect(modes.every((mode) => mode === null)).toBe(true);
    for (const session of accounts.filter((item) => item.role !== 'web_admin')) {
      expect(groupAccess(session, 'website', 'banners'), session.accountId).toBeNull();
    }
  });

  it('setiap menu di registry bisa dibuka minimal satu peran', () => {
    for (const route of moduleRoutes) {
      const reachable = accounts.some((session) => routeAccess(session, route) !== null);
      expect(reachable, route.path).toBe(true);
    }
  });

  it('setiap kelompok Admin operasional punya aturan', () => {
    const admin = sections.find((section) => section.id === 'admin');
    expect(admin?.groups.map((group) => group.slug).sort()).toEqual(
      [...adminGroupRuleSlugs].sort(),
    );
  });

  it('Admin hanya mengelola unitnya sendiri', () => {
    expect(groupAccess(adminMobile, 'telkomsel', 'setting')).toBe('manage');
    expect(groupAccess(adminMobile, 'indihome', 'dashboard')).toBeNull();
    expect(groupAccess(adminHousehold, 'indihome', 'setting')).toBe('manage');
    expect(groupAccess(adminHousehold, 'telkomsel', 'dashboard')).toBeNull();
    expect(groupAccess(adminHousehold, 'admin', 'abkshop-outlet')).toBeNull();
    expect(groupAccess(adminMobile, 'admin', 'indihome')).toBeNull();
  });

  it('Kelola Karir dan User Management butuh izin tambahan, bukan jabatan', () => {
    expect(groupAccess(adminMobile, 'admin', 'kelola-karir')).toBe('manage');
    expect(groupAccess(adminHousehold, 'admin', 'kelola-karir')).toBeNull();
    expect(
      groupAccess({ ...adminHousehold, permissions: ['user.manage'] }, 'admin', 'user-management'),
    ).toBe('manage');
  });

  it('Manager melihat dua unit tetapi tidak mengelola apa pun', () => {
    const modes = moduleRoutes.map((route) => routeAccess(manager, route));
    expect(modes).not.toContain('manage');
    expect(groupAccess(manager, 'telkomsel', 'fee-komisi')).toBe('view');
    expect(groupAccess(manager, 'indihome', 'kpi')).toBe('view');
    expect(groupAccess(manager, 'telkomsel', 'setting')).toBeNull();
    expect(visibleSections(manager).map((item) => item.section.id)).toEqual([
      'telkomsel',
      'indihome',
    ]);
  });

  it('Supervisor dan Salesforce terbatas pada unitnya dan tidak melihat fee', () => {
    for (const session of [supervisorMobile, salesMobile, salesDirect]) {
      expect(groupAccess(session, 'telkomsel', 'fee-komisi'), session.accountId).toBeNull();
      expect(
        visibleSections(session).map((item) => item.section.id),
        session.accountId,
      ).toEqual(['telkomsel']);
    }
    for (const session of [supervisorHousehold, salesHousehold]) {
      expect(groupAccess(session, 'indihome', 'fee-komisi'), session.accountId).toBeNull();
      expect(
        visibleSections(session).map((item) => item.section.id),
        session.accountId,
      ).toEqual(['indihome']);
    }
  });

  it('Salesforce Direct Sales hanya melihat Direct to Customer dan menu pendukungnya', () => {
    expect(groupAccess(salesDirect, 'telkomsel', 'direct-to-customer')).toBe('view');
    expect(groupAccess(salesDirect, 'telkomsel', 'outlet')).toBeNull();
    expect(groupAccess(salesMobile, 'telkomsel', 'direct-to-customer')).toBeNull();
  });

  it('tidak ada peran selain Admin yang masuk ke Admin operasional', () => {
    for (const session of [
      manager,
      supervisorMobile,
      supervisorHousehold,
      salesMobile,
      salesHousehold,
      salesDirect,
    ]) {
      const adminRoutes = moduleRoutes.filter((route) => route.section.id === 'admin');
      expect(
        adminRoutes.some((route) => routeAccess(session, route) !== null),
        session.accountId,
      ).toBe(false);
    }
  });

  it('label peran menggabungkan jabatan dan unit', () => {
    expect(accounts.map(roleLabel)).toEqual([
      'Admin Web',
      'Admin Mobile',
      'Admin Household',
      'Manager',
      'Supervisor Mobile',
      'Supervisor Household',
      'Salesforce Mobile',
      'Salesforce Household',
      'Salesforce Direct Sales',
    ]);
  });
});
