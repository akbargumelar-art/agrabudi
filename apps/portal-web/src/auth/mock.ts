import {
  staffProfileUpdateSchema,
  staffSessionSchema,
  type BusinessUnit,
  type DataScope,
  type StaffPermission,
  type StaffRole,
  type StaffSession,
} from '@agrabudi/contracts';
import { personByUsername } from '../data/mock/org';
import { InvalidCredentialsError, type AuthAdapter } from './adapter';

/**
 * AKUN CONTOH untuk kerangka tampilan. Bukan akun sungguhan dan tidak ikut ke build
 * dengan sumber data `api` (PRD 4.15 butir 2). Kata sandinya sama untuk semua akun
 * contoh dan hanya berlaku di mock; akun sungguhan dibuat pengelola akses di server.
 */
export const DEMO_PASSWORD = 'contoh123';

function account(
  username: string,
  role: StaffRole,
  unit: BusinessUnit | null,
  scope: DataScope,
  label: string,
  permissions: StaffPermission[] = [],
): StaffSession {
  return staffSessionSchema.parse({
    accountId: `contoh-${username}`,
    username,
    displayName: personByUsername(username)?.name ?? `Akun contoh ${label}`,
    email: `${username}@contoh.invalid`,
    phone: null,
    role,
    unit,
    scope,
    permissions,
  });
}

export const demoAccounts: StaffSession[] = [
  account('adminweb', 'web_admin', null, 'site', 'Admin Web'),
  // Izin Karir dan Pengguna dititipkan sementara di Admin Mobile sampai pemiliknya diputuskan.
  account('adminmobile', 'admin', 'mobile', 'cluster', 'Admin Mobile', [
    'career.manage',
    'user.manage',
  ]),
  account('adminhousehold', 'admin', 'household', 'cluster', 'Admin Household'),
  account('manager', 'manager', null, 'cluster', 'Manager'),
  account('spvmobile', 'supervisor', 'mobile', 'team', 'Supervisor Mobile'),
  account('spvhousehold', 'supervisor', 'household', 'team', 'Supervisor Household'),
  account('sfmobile', 'salesforce', 'mobile', 'self', 'Salesforce Mobile'),
  account('sfhousehold', 'salesforce', 'household', 'self', 'Salesforce Household'),
  account('sfdirect', 'salesforce', 'direct_sales', 'self', 'Salesforce Direct Sales'),
];

/** Perubahan profil di mode kerangka hanya hidup selama halaman terbuka. */
const profiles = new Map<string, StaffSession>(demoAccounts.map((item) => [item.username, item]));

export const mockAuthAdapter: AuthAdapter = {
  signIn: async ({ username, password }) => {
    const found = profiles.get(username.trim().toLowerCase());
    if (!found || password !== DEMO_PASSWORD) throw new InvalidCredentialsError();
    return found;
  },
  updateProfile: async (session, update) => {
    const current = profiles.get(session.username) ?? session;
    // Hanya tiga kolom ini yang diambil; username, peran, unit, dan cakupan tidak bisa ikut berubah.
    const { displayName, email, phone } = staffProfileUpdateSchema.parse(update);
    const next = staffSessionSchema.parse({ ...current, displayName, email, phone });
    profiles.set(next.username, next);
    return next;
  },
  // Mode contoh menyimpan sesi kerangka di sessionStorage (lihat SessionContext).
  restore: async () => null,
  signOut: async () => undefined,
};
