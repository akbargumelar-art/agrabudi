import { z } from 'zod';

/**
 * Akun operasional Portal (realm staff). Administrator Web BUKAN bagian dari sini:
 * ia punya akun, sesi, dan console sendiri di /web-admin (PRD K-09).
 *
 * Hak akses = jabatan x unit bisnis x cakupan data, bukan satu daftar role panjang.
 * Contoh: "Supervisor Household" = role supervisor + unit household + cakupan team.
 */
export const staffRoleSchema = z.enum(['admin', 'manager', 'supervisor', 'salesforce']);
export type StaffRole = z.infer<typeof staffRoleSchema>;

/** Mobile = distribusi Telkomsel, Household = IndiHome, Direct Sales = D2C. */
export const businessUnitSchema = z.enum(['mobile', 'household', 'direct_sales']);
export type BusinessUnit = z.infer<typeof businessUnitSchema>;

/** Seberapa luas data yang boleh dilihat: satu cluster, satu tim, atau milik sendiri. */
export const dataScopeSchema = z.enum(['cluster', 'team', 'self']);
export type DataScope = z.infer<typeof dataScopeSchema>;

/** Izin tambahan di luar jabatan. Tidak otomatis ikut jabatan mana pun (PRD 2.5). */
export const staffPermissionSchema = z.enum(['career.manage', 'user.manage']);
export type StaffPermission = z.infer<typeof staffPermissionSchema>;

export const staffSessionSchema = z.object({
  accountId: z.string().min(1),
  displayName: z.string().min(1),
  role: staffRoleSchema,
  /** `null` berarti lintas unit (Manager). */
  unit: businessUnitSchema.nullable(),
  scope: dataScopeSchema,
  permissions: z.array(staffPermissionSchema),
});
export type StaffSession = z.infer<typeof staffSessionSchema>;
