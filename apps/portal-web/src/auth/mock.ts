import {
  passwordChangeSchema,
  passwordResetConfirmSchema,
  staffProfileUpdateSchema,
  staffSessionSchema,
  type BusinessUnit,
  type DataScope,
  type StaffPermission,
  type StaffRole,
  type StaffSession,
} from '@agrabudi/contracts';
import { personByUsername } from '../data/mock/org';
import { FieldError, InvalidCredentialsError, type AuthAdapter } from './adapter';

/**
 * AKUN CONTOH untuk kerangka tampilan. Bukan akun sungguhan dan tidak ikut ke build
 * dengan sumber data `api` (PRD 4.15 butir 2). Kata sandinya sama untuk semua akun
 * contoh dan hanya berlaku di mock; akun sungguhan dibuat pengelola akses di server.
 */
export const DEMO_PASSWORD = 'contoh123';

/**
 * Akun contoh yang masih memakai kata sandi sementara, untuk mencoba alur "login pertama
 * wajib ganti kata sandi". Kata sandinya juga contoh dan hanya berlaku di mock.
 */
export const DEMO_PENDING_USERNAME = 'sfbaru';
export const DEMO_TEMP_PASSWORD = 'Contoh-Sementara-1';

/**
 * Mode contoh tidak mengirim WhatsApp. Kode reset contoh ini tampil berlabel di halaman
 * lupa kata sandi supaya alurnya bisa dicoba; server sungguhan tidak pernah menampilkannya.
 */
export const DEMO_RESET_CODE = '123456';

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
    mustChangePassword: false,
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

/** Akun baru contoh: belum mengganti kata sandi sementara. Tidak ikut daftar menu per peran. */
const pendingAccount = staffSessionSchema.parse({
  ...account(DEMO_PENDING_USERNAME, 'salesforce', 'mobile', 'self', 'Salesforce Baru'),
  mustChangePassword: true,
});

/** Perubahan profil dan kata sandi di mode kerangka hanya hidup selama halaman terbuka. */
const profiles = new Map<string, StaffSession>(
  [...demoAccounts, pendingAccount].map((item) => [item.username, item]),
);
const passwords = new Map<string, string>([[DEMO_PENDING_USERNAME, DEMO_TEMP_PASSWORD]]);
const passwordOf = (username: string) => passwords.get(username) ?? DEMO_PASSWORD;

const wrongCode = () =>
  new FieldError('Kode salah atau sudah tidak berlaku. Minta kode baru bila perlu.', {
    code: 'Kode salah atau sudah tidak berlaku.',
  });

export const mockAuthAdapter: AuthAdapter = {
  signIn: async ({ username, password }) => {
    const key = username.trim().toLowerCase();
    const found = profiles.get(key);
    if (!found || password !== passwordOf(key)) throw new InvalidCredentialsError();
    return found;
  },
  changePassword: async (session, input) => {
    const parsed = passwordChangeSchema.safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new FieldError(issue?.message ?? 'Isian belum sesuai.', {
        [String(issue?.path[0] ?? '_')]: issue?.message ?? 'Isian belum sesuai.',
      });
    }
    if (parsed.data.currentPassword !== passwordOf(session.username)) {
      throw new FieldError('Kata sandi saat ini salah.', {
        currentPassword: 'Kata sandi saat ini salah.',
      });
    }
    passwords.set(session.username, parsed.data.newPassword);
    const current = profiles.get(session.username) ?? session;
    const next = staffSessionSchema.parse({ ...current, mustChangePassword: false });
    profiles.set(next.username, next);
    return next;
  },
  requestPasswordReset: async () => undefined,
  confirmPasswordReset: async (input) => {
    const { identifier, code, newPassword } = passwordResetConfirmSchema.parse(input);
    const key = identifier.trim().toLowerCase();
    if (!profiles.has(key) || code !== DEMO_RESET_CODE) throw wrongCode();
    passwords.set(key, newPassword);
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
