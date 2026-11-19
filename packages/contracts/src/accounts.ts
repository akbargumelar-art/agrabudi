import { z } from 'zod';
import {
  businessUnitSchema,
  dataScopeSchema,
  newPasswordSchema,
  staffPermissionSchema,
  staffRoleSchema,
  type BusinessUnit,
  type DataScope,
} from './auth';
import { phoneIdSchema } from './forms';

/**
 * Kata sandi: ganti sendiri, reset mandiri lewat kode WhatsApp, dan pengelolaan akun oleh
 * Admin berizin `user.manage`. Kata sandi awal dan hasil reset admin selalu acak dari server,
 * dikirim ke WhatsApp pemilik akun, dan wajib diganti saat login berikutnya.
 */

/** Ganti kata sandi oleh pemilik akun (termasuk ganti wajib setelah kata sandi sementara). */
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Kata sandi saat ini wajib diisi.').max(200),
    newPassword: newPasswordSchema,
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    path: ['newPassword'],
    message: 'Kata sandi baru harus berbeda dari kata sandi saat ini.',
  });
export type PasswordChange = z.infer<typeof passwordChangeSchema>;

/** Username Portal atau ID Digipos. Bentuk akhirnya dinormalkan per realm di server. */
const identifierSchema = z.string().trim().min(1, 'Wajib diisi.').max(64);

/** Langkah 1 reset mandiri: minta kode. Jawaban server selalu sama, ada atau tidak ada akunnya. */
export const passwordResetRequestSchema = z.object({ identifier: identifierSchema });
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;

/** Kode reset: 6 angka lewat WhatsApp, berlaku singkat, dan gugur setelah beberapa kali salah. */
export const PASSWORD_RESET_CODE_TTL_MINUTES = 10;
export const PASSWORD_RESET_MAX_ATTEMPTS = 5;

/** Langkah 2 reset mandiri: kode dari WhatsApp dan kata sandi baru. */
export const passwordResetConfirmSchema = z.object({
  identifier: identifierSchema,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Kode terdiri dari 6 angka.'),
  newPassword: newPasswordSchema,
});
export type PasswordResetConfirm = z.infer<typeof passwordResetConfirmSchema>;

export const accountStatusSchema = z.enum(['active', 'disabled']);
export type AccountStatus = z.infer<typeof accountStatusSchema>;

/**
 * Peran yang boleh dibuat dari menu User Management. Manager (lintas unit) dan Admin Web
 * hanya dibuat pengelola teknis lewat CLI server.
 */
export const manageableStaffRoleSchema = z.enum(['admin', 'supervisor', 'salesforce']);
export type ManageableStaffRole = z.infer<typeof manageableStaffRoleSchema>;

/** Cakupan data mengikuti jabatan; tidak dipilih bebas supaya tidak ada kombinasi yang salah. */
export const SCOPE_BY_ROLE: Record<ManageableStaffRole, DataScope> = {
  admin: 'cluster',
  supervisor: 'team',
  salesforce: 'self',
};

/**
 * Unit yang boleh dikelola Admin per unitnya. BASELINE USULAN (D-B4): Direct Sales sementara
 * di bawah Mobile, sama seperti struktur tim contoh. Akun Outlet dikelola Admin Mobile.
 */
export const MANAGED_UNITS: Record<BusinessUnit, readonly BusinessUnit[]> = {
  mobile: ['mobile', 'direct_sales'],
  household: ['household'],
  direct_sales: [],
};
export const OUTLET_MANAGER_UNIT: BusinessUnit = 'mobile';

export const managedStaffAccountSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  displayName: z.string().min(1),
  phone: z.string().nullable(),
  role: staffRoleSchema,
  unit: businessUnitSchema.nullable(),
  scope: dataScopeSchema,
  permissions: z.array(staffPermissionSchema),
  status: accountStatusSchema,
  mustChangePassword: z.boolean(),
  /** Akun yang sedang login: tampil, tetapi tidak bisa dinonaktifkan atau direset dari sini. */
  isSelf: z.boolean(),
});
export type ManagedStaffAccount = z.infer<typeof managedStaffAccountSchema>;

export const managedOutletAccountSchema = z.object({
  id: z.string().min(1),
  digiposId: z.string().min(1),
  outletName: z.string().min(1),
  ownerName: z.string().min(1),
  tap: z.string().nullable(),
  phone: z.string(),
  registeredAt: z.iso.date(),
  status: accountStatusSchema,
  mustChangePassword: z.boolean(),
});
export type ManagedOutletAccount = z.infer<typeof managedOutletAccountSchema>;

const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'Nama wajib diisi.')
  .max(80, 'Nama terlalu panjang.');
const outletNameSchema = z
  .string()
  .trim()
  .min(1, 'Nama outlet wajib diisi.')
  .max(120, 'Nama outlet terlalu panjang.');
const tapSchema = z.string().trim().max(80, 'Nama TAP terlalu panjang.').nullable();

export const createStaffAccountSchema = z
  .object({
    username: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9._-]{3,64}$/, 'Username 3-64 karakter: huruf kecil, angka, titik, - atau _.'),
    displayName: displayNameSchema,
    /** Wajib: kata sandi sementara dikirim ke nomor WhatsApp ini. */
    phone: phoneIdSchema,
    role: manageableStaffRoleSchema,
    unit: businessUnitSchema,
    permissions: z.array(staffPermissionSchema).max(5),
  })
  .refine((value) => value.role === 'admin' || value.permissions.length === 0, {
    path: ['permissions'],
    message: 'Izin tambahan hanya untuk peran Admin.',
  });
export type CreateStaffAccount = z.infer<typeof createStaffAccountSchema>;

export const updateStaffAccountSchema = z.object({
  displayName: displayNameSchema,
  phone: phoneIdSchema,
  status: accountStatusSchema,
});
export type UpdateStaffAccount = z.infer<typeof updateStaffAccountSchema>;

export const createOutletAccountSchema = z.object({
  digiposId: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{3,32}$/, 'ID Digipos 3-32 huruf atau angka.'),
  outletName: outletNameSchema,
  ownerName: displayNameSchema,
  tap: tapSchema,
  phone: phoneIdSchema,
  registeredAt: z.iso.date('Tanggal terdaftar belum benar.'),
});
export type CreateOutletAccount = z.infer<typeof createOutletAccountSchema>;

export const updateOutletAccountSchema = z.object({
  outletName: outletNameSchema,
  ownerName: displayNameSchema,
  tap: tapSchema,
  phone: phoneIdSchema,
  status: accountStatusSchema,
});
export type UpdateOutletAccount = z.infer<typeof updateOutletAccountSchema>;

/**
 * Hasil membuat akun atau reset oleh admin. `whatsapp` = kata sandi sementara sudah diterima
 * WAHA untuk dikirim ke nomor pemilik. `mock` = mode contoh, tidak ada yang dikirim; kata sandi
 * contoh ditampilkan supaya alur bisa dicoba. Server sungguhan tidak pernah mengembalikan kata sandi.
 */
export const credentialDeliverySchema = z.discriminatedUnion('channel', [
  z.object({ channel: z.literal('whatsapp'), maskedPhone: z.string() }),
  z.object({ channel: z.literal('mock'), temporaryPassword: z.string().min(12) }),
]);
export type CredentialDelivery = z.infer<typeof credentialDeliverySchema>;

/** Jawaban membuat akun atau reset oleh admin. */
export const credentialIssueResultSchema = z.object({
  id: z.string().min(1),
  delivery: credentialDeliverySchema,
});
export type CredentialIssueResult = z.infer<typeof credentialIssueResultSchema>;

/** Nomor HP disamarkan untuk ditampilkan: 0812****7890. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8) return '****';
  return `${digits.slice(0, 4)}****${digits.slice(-4)}`;
}

