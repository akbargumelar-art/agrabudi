import { z } from 'zod';

/**
 * Akun Portal. Satu pintu login: sistem membuka menu sesuai peran akun (keputusan Abay,
 * 15 Nov 2026). Hak akses = jabatan x unit bisnis x cakupan data, bukan satu daftar
 * role panjang. Contoh: "Supervisor Household" = supervisor + household + team.
 *
 * `web_admin` hanya mengatur isi website. Ia tidak mendapat akses data bisnis, dan
 * peran operasional tidak mendapat akses pengaturan website (PRD K-09, K-10).
 */
export const staffRoleSchema = z.enum([
  'web_admin',
  'admin',
  'manager',
  'supervisor',
  'salesforce',
]);
export type StaffRole = z.infer<typeof staffRoleSchema>;

/** Mobile = distribusi Telkomsel, Household = IndiHome, Direct Sales = D2C. */
export const businessUnitSchema = z.enum(['mobile', 'household', 'direct_sales']);
export type BusinessUnit = z.infer<typeof businessUnitSchema>;

/** Seberapa luas data yang boleh dilihat. `site` = isi website saja, tanpa data bisnis. */
export const dataScopeSchema = z.enum(['site', 'cluster', 'team', 'self']);
export type DataScope = z.infer<typeof dataScopeSchema>;

/** Izin tambahan di luar jabatan. Tidak otomatis ikut jabatan mana pun (PRD 2.5). */
export const staffPermissionSchema = z.enum(['career.manage', 'user.manage']);
export type StaffPermission = z.infer<typeof staffPermissionSchema>;

export const staffSessionSchema = z.object({
  accountId: z.string().min(1),
  /** Dipakai untuk login. Tidak bisa diubah pengguna. */
  username: z.string().min(1),
  displayName: z.string().min(1),
  email: z.email().nullable(),
  /** Nomor HP disimpan sebagai teks supaya nol di depan tidak hilang. */
  phone: z.string().nullable(),
  role: staffRoleSchema,
  /** `null` berarti lintas unit (Manager) atau tidak terkait unit (Admin Web). */
  unit: businessUnitSchema.nullable(),
  scope: dataScopeSchema,
  permissions: z.array(staffPermissionSchema),
});
export type StaffSession = z.infer<typeof staffSessionSchema>;

/** Bagian profil yang boleh diubah pemilik akun. Username, peran, dan cakupan tidak termasuk. */
export const staffProfileUpdateSchema = z.object({
  displayName: z.string().trim().min(1, 'Nama wajib diisi.').max(80, 'Nama terlalu panjang.'),
  email: z.email('Format email belum benar.').nullable(),
  phone: z
    .string()
    .regex(/^\+?\d{8,15}$/, 'Nomor HP hanya angka, 8 sampai 15 digit.')
    .nullable(),
});
export type StaffProfileUpdate = z.infer<typeof staffProfileUpdateSchema>;

/**
 * Akun mitra outlet (aplikasi Outlet). Realm terpisah dari akun Portal: login memakai
 * ID Digipos, seperti aplikasi poin-outlet lama.
 */
export const outletSessionSchema = z.object({
  digiposId: z.string().min(1),
  outletName: z.string().min(1),
  ownerName: z.string().min(1),
  tap: z.string().nullable(),
});
export type OutletSession = z.infer<typeof outletSessionSchema>;

/** Profil outlet yang tampil di halaman Akun aplikasi Outlet. */
export const outletProfileSchema = outletSessionSchema.extend({
  phone: z.string(),
  address: z.string(),
  district: z.string(),
  salesforceName: z.string().nullable(),
  registeredAt: z.iso.date(),
  photoUrl: z.string().nullable(),
  programs: z.array(
    z.object({
      programTitle: z.string().min(1),
      progress: z.string(),
      status: z.enum(['berjalan', 'tercapai', 'tidak_tercapai']),
    }),
  ),
});
export type OutletProfile = z.infer<typeof outletProfileSchema>;
