import type { BusinessUnit, StaffPermission, StaffSession } from '@agrabudi/contracts';
import {
  sections,
  type ModuleGroup,
  type ModuleRoute,
  type Section,
  type SectionId,
} from '../registry';

/**
 * Aturan tampilan menu per jabatan, unit, dan izin. BASELINE USULAN, belum disahkan
 * (PRD 2.5). Aturan ini hanya menyaring menu di browser; keputusan akses yang mengikat
 * dibuat server pada setiap permintaan (PRD 4.13).
 */
export type AccessMode = 'manage' | 'view';

/** Menu yang hanya untuk pengelola data: tidak tampil bagi peran yang sekadar melihat. */
const MANAGE_ONLY = ['setting', 'user-management'];
/** Fee/komisi butuh izin keuangan; bawaannya tertutup untuk Supervisor dan Salesforce. */
const FINANCE = ['fee-komisi'];

const SALESFORCE_MOBILE = [
  'dashboard',
  'outlet',
  'sales-plan',
  'sellthru',
  'performansi',
  'kpi',
  'program',
  'doa',
  'monitoring-pop',
  'komplain',
  'dokumentasi',
  'link-penting',
];
const SALESFORCE_DIRECT = [
  'dashboard',
  'direct-to-customer',
  'komplain',
  'dokumentasi',
  'link-penting',
];
const SALESFORCE_HOUSEHOLD = [
  'dashboard',
  'kpi',
  'performance',
  'ctb',
  'database-pelanggan',
  'pop-material',
  'clock-in-mb',
  'dokumentasi',
  'pelanggan',
  'komplain-kendala',
];

/** Unit bisnis pemilik tiap bagian Portal. */
const SECTION_UNIT: Record<Exclude<SectionId, 'admin'>, BusinessUnit> = {
  telkomsel: 'mobile',
  indihome: 'household',
};

/** Kelompok Admin operasional: unit yang mengelola dan izin tambahan bila perlu. */
const ADMIN_GROUPS: Record<string, { units: BusinessUnit[]; permission?: StaffPermission }> = {
  'kelola-karir': { units: ['mobile', 'household'], permission: 'career.manage' },
  'abkshop-pelanggan': { units: ['mobile'] },
  'abkshop-outlet': { units: ['mobile'] },
  indihome: { units: ['household'] },
  'promo-program': { units: ['mobile', 'household'] },
  'daftar-digipos': { units: ['mobile'] },
  'admin-input': { units: ['mobile', 'household'] },
  'pengaturan-operasional': { units: ['mobile', 'household'] },
  'user-management': { units: ['mobile', 'household'], permission: 'user.manage' },
};

function unitSectionAccess(
  session: StaffSession,
  sectionId: 'telkomsel' | 'indihome',
  group: string,
): AccessMode | null {
  const sectionUnit = SECTION_UNIT[sectionId];
  switch (session.role) {
    case 'admin':
      return session.unit === sectionUnit ? 'manage' : null;
    case 'manager':
      return MANAGE_ONLY.includes(group) ? null : 'view';
    case 'supervisor':
      if (session.unit !== sectionUnit) return null;
      return [...MANAGE_ONLY, ...FINANCE].includes(group) ? null : 'view';
    case 'salesforce': {
      if (sectionId === 'indihome') {
        return session.unit === 'household' && SALESFORCE_HOUSEHOLD.includes(group) ? 'view' : null;
      }
      if (session.unit === 'mobile') return SALESFORCE_MOBILE.includes(group) ? 'view' : null;
      if (session.unit === 'direct_sales') return SALESFORCE_DIRECT.includes(group) ? 'view' : null;
      return null;
    }
  }
}

export function groupAccess(
  session: StaffSession,
  sectionId: SectionId,
  group: string,
): AccessMode | null {
  if (sectionId !== 'admin') return unitSectionAccess(session, sectionId, group);
  if (session.role !== 'admin' || session.unit === null) return null;
  const rule = ADMIN_GROUPS[group];
  if (!rule || !rule.units.includes(session.unit)) return null;
  if (rule.permission && !session.permissions.includes(rule.permission)) return null;
  return 'manage';
}

export function routeAccess(session: StaffSession, route: ModuleRoute): AccessMode | null {
  return groupAccess(session, route.section.id, route.group.slug);
}

export type VisibleSection = { section: Section; groups: ModuleGroup[]; entryPath: string };

/** Bagian dan menu yang tampil untuk sesi ini, dengan halaman pertama yang boleh dibuka. */
export function visibleSections(session: StaffSession): VisibleSection[] {
  const result: VisibleSection[] = [];
  for (const section of sections) {
    const groups = section.groups.filter(
      (group) => groupAccess(session, section.id, group.slug) !== null,
    );
    const first = groups[0];
    if (!first) continue;
    result.push({ section, groups, entryPath: `${section.prefix}/${first.slug}` });
  }
  return result;
}

const UNIT_LABEL: Record<BusinessUnit, string> = {
  mobile: 'Mobile',
  household: 'Household',
  direct_sales: 'Direct Sales',
};

export function roleLabel(session: Pick<StaffSession, 'role' | 'unit'>): string {
  const unit = session.unit ? ` ${UNIT_LABEL[session.unit]}` : '';
  switch (session.role) {
    case 'admin':
      return `Admin${unit}`;
    case 'manager':
      return 'Manager';
    case 'supervisor':
      return `Supervisor${unit}`;
    case 'salesforce':
      return `Salesforce${unit}`;
  }
}

export function scopeLabel(session: Pick<StaffSession, 'scope'>): string {
  switch (session.scope) {
    case 'cluster':
      return 'Seluruh cluster';
    case 'team':
      return 'Tim Anda';
    case 'self':
      return 'Data Anda sendiri';
  }
}

/** Cakupan data untuk dipakai di tengah kalimat. */
export function scopePhrase(session: Pick<StaffSession, 'scope'>): string {
  switch (session.scope) {
    case 'cluster':
      return 'seluruh cluster';
    case 'team':
      return 'tim Anda';
    case 'self':
      return 'data Anda sendiri';
  }
}

export const accessModeLabel: Record<AccessMode, string> = {
  manage: 'Kelola',
  view: 'Lihat',
};

/** Dipakai tes untuk memastikan setiap kelompok Admin punya aturan. */
export const adminGroupRuleSlugs = Object.keys(ADMIN_GROUPS);
