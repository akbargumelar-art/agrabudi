import type { BusinessUnit, StaffPermission, StaffSession } from './auth';

/**
 * Siapa yang boleh mengelola tiap kelompok menu Admin operasional (PRD 2.5, 2.10).
 * BASELINE USULAN, belum disahkan: izin per modul (`catalog.outlet.manage` dan seterusnya)
 * dari PRD 2.5 belum dipecah, jadi sementara memakai unit bisnis Admin.
 *
 * Satu sumber untuk dua pemakai: Portal memakainya untuk menyaring menu, API memakainya
 * sebagai keputusan akses yang mengikat pada setiap permintaan.
 */
export const ADMIN_GROUP_RULES: Readonly<
  Record<string, { units: readonly BusinessUnit[]; permission?: StaffPermission }>
> = {
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

/** Boleh mengelola kelompok Admin ini? Admin Web dan peran non-Admin selalu ditolak. */
export function canManageAdminGroup(
  session: Pick<StaffSession, 'role' | 'unit' | 'permissions'>,
  group: string,
): boolean {
  if (session.role !== 'admin' || session.unit === null) return false;
  const rule = ADMIN_GROUP_RULES[group];
  if (!rule || !rule.units.includes(session.unit)) return false;
  return rule.permission ? session.permissions.includes(rule.permission) : true;
}
