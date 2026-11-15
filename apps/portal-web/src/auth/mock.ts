import { staffSessionSchema, type StaffSession } from '@agrabudi/contracts';
import { AuthUnavailableError, type AuthAdapter, type DemoAccount } from './adapter';

/**
 * AKUN CONTOH untuk kerangka tampilan. Bukan akun sungguhan, tanpa kata sandi,
 * dan tidak ikut ke build dengan sumber data `api` (PRD 4.15 butir 2).
 */
function account(session: StaffSession, summary: string): DemoAccount {
  return { session: staffSessionSchema.parse(session), summary };
}

const demoAccounts: DemoAccount[] = [
  account(
    {
      accountId: 'contoh-admin-mobile',
      displayName: 'Akun contoh Admin Mobile',
      role: 'admin',
      unit: 'mobile',
      scope: 'cluster',
      // Izin Karir dan Pengguna dititipkan sementara di akun ini sampai pemiliknya diputuskan.
      permissions: ['career.manage', 'user.manage'],
    },
    'Kelola dan unggah data Telkomsel serta data Outlet.',
  ),
  account(
    {
      accountId: 'contoh-admin-household',
      displayName: 'Akun contoh Admin Household',
      role: 'admin',
      unit: 'household',
      scope: 'cluster',
      permissions: [],
    },
    'Kelola dan unggah data IndiHome.',
  ),
  account(
    {
      accountId: 'contoh-manager',
      displayName: 'Akun contoh Manager',
      role: 'manager',
      unit: null,
      scope: 'cluster',
      permissions: [],
    },
    'Lihat data Telkomsel dan IndiHome satu cluster.',
  ),
  account(
    {
      accountId: 'contoh-supervisor-mobile',
      displayName: 'Akun contoh Supervisor Mobile',
      role: 'supervisor',
      unit: 'mobile',
      scope: 'team',
      permissions: [],
    },
    'Lihat data Telkomsel tim sendiri.',
  ),
  account(
    {
      accountId: 'contoh-supervisor-household',
      displayName: 'Akun contoh Supervisor Household',
      role: 'supervisor',
      unit: 'household',
      scope: 'team',
      permissions: [],
    },
    'Lihat data IndiHome tim sendiri.',
  ),
  account(
    {
      accountId: 'contoh-salesforce-mobile',
      displayName: 'Akun contoh Salesforce Mobile',
      role: 'salesforce',
      unit: 'mobile',
      scope: 'self',
      permissions: [],
    },
    'Lihat data Telkomsel milik sendiri.',
  ),
  account(
    {
      accountId: 'contoh-salesforce-household',
      displayName: 'Akun contoh Salesforce Household',
      role: 'salesforce',
      unit: 'household',
      scope: 'self',
      permissions: [],
    },
    'Lihat data IndiHome milik sendiri.',
  ),
  account(
    {
      accountId: 'contoh-salesforce-direct',
      displayName: 'Akun contoh Salesforce Direct Sales',
      role: 'salesforce',
      unit: 'direct_sales',
      scope: 'self',
      permissions: [],
    },
    'Lihat data Direct to Customer milik sendiri.',
  ),
];

export const mockAuthAdapter: AuthAdapter = {
  signIn: async () => {
    throw new AuthUnavailableError(
      'Mode kerangka tidak memakai kata sandi. Pilih salah satu akun contoh.',
    );
  },
  demoAccounts,
  signInAsDemo: async (accountId) => {
    const found = demoAccounts.find((item) => item.session.accountId === accountId);
    if (!found) throw new AuthUnavailableError('Akun contoh tidak ditemukan.');
    return found.session;
  },
};
