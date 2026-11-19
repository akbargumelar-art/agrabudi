import { z } from 'zod';
import { appIdSchema } from './apps';
import { contentStatusSchema } from './meta';

/** Halaman institusional milik Administrator Web (PRD 2.4). */
export const sitePageSchema = z.object({
  id: z.string().min(1),
  site: appIdSchema,
  slug: z.string().min(1),
  title: z.string().min(1),
  status: contentStatusSchema,
  updatedAt: z.iso.datetime(),
});
export type SitePage = z.infer<typeof sitePageSchema>;

/**
 * Banner menurut website, halaman, slot, dan periode. Banner boleh menunjuk
 * objek bisnis, tetapi judul/harga/syarat tetap diambil dari objek itu.
 */
export const siteBannerSchema = z.object({
  id: z.string().min(1),
  site: appIdSchema,
  page: z.string().min(1),
  slot: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().nullable(),
  /** Tombol pada banner. Keduanya `null` berarti banner tanpa tombol. */
  ctaLabel: z.string().nullable(),
  ctaHref: z.string().nullable(),
  imageUrl: z.string().nullable(),
  startsAt: z.iso.date(),
  endsAt: z.iso.date(),
  status: contentStatusSchema,
});
export type SiteBanner = z.infer<typeof siteBannerSchema>;

export const publicationRecordSchema = z.object({
  id: z.string().min(1),
  objectType: z.enum(['page', 'banner', 'navigation', 'layout']),
  objectTitle: z.string().min(1),
  revision: z.number().int().positive(),
  publishedAt: z.iso.datetime(),
});
export type PublicationRecord = z.infer<typeof publicationRecordSchema>;

/** Profil institusional yang tampil di Tentang Kami, Area, Kantor, dan Hubungi Kami (milik Admin Web). */
export const companyProfileSchema = z.object({
  about: z.array(z.string()),
  history: z.array(z.string()),
  vision: z.string(),
  missions: z.array(z.string()),
  areas: z.array(
    z
      .object({
        name: z.string().min(1),
        districts: z.array(z.string()),
        /**
         * Titik wilayah (WGS84) untuk tautan peta. `default(null)` menjaga dokumen lama
         * yang tersimpan sebelum kolom ini ada tetap terbaca.
         */
        latitude: z
          .number({ error: 'Isi koordinat seperti -6.7320, 108.5523.' })
          .min(-90, 'Lintang harus antara -90 dan 90.')
          .max(90, 'Lintang harus antara -90 dan 90.')
          .nullable()
          .default(null),
        longitude: z
          .number({ error: 'Isi koordinat seperti -6.7320, 108.5523.' })
          .min(-180, 'Bujur harus antara -180 dan 180.')
          .max(180, 'Bujur harus antara -180 dan 180.')
          .nullable()
          .default(null),
        /** Foto wilayah dari Aset Website. `null` berarti tanpa foto. */
        imageUrl: z.string().nullable().default(null),
      })
      .refine((area) => (area.latitude === null) === (area.longitude === null), {
        message: 'Lintang dan bujur diisi keduanya atau dikosongkan keduanya.',
        path: ['latitude'],
      }),
  ),
  offices: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      address: z.string(),
      hours: z.string(),
      phone: z.string(),
      imageUrl: z.string().nullable(),
    }),
  ),
  channels: z
    .array(
      z.object({
        kind: z.enum(['whatsapp', 'phone', 'email', 'instagram', 'facebook', 'website']),
        label: z.string().min(1),
        value: z.string().min(1),
      }),
    )
    // Halaman kontak menampilkan satu baris per jenis kanal.
    .refine((list) => new Set(list.map((item) => item.kind)).size === list.length, {
      message: 'Satu jenis kanal hanya boleh muncul sekali.',
    }),
});
export type CompanyProfile = z.infer<typeof companyProfileSchema>;

/** Editor terpisah: tiap simpan hanya menyentuh bagian profil yang sedang dibuka. */
export const companyProfileSections = {
  about: companyProfileSchema
    .pick({ about: true, history: true, vision: true, missions: true })
    .strict(),
  areas: companyProfileSchema.pick({ areas: true }).strict(),
  offices: companyProfileSchema.pick({ offices: true }).strict(),
  channels: companyProfileSchema.pick({ channels: true }).strict(),
} as const;
export type CompanyProfileSection = keyof typeof companyProfileSections;
export type CompanySectionData<K extends CompanyProfileSection> = z.infer<
  (typeof companyProfileSections)[K]
>;

export const emptyCompanyProfile: CompanyProfile = {
  about: [],
  history: [],
  vision: '',
  missions: [],
  areas: [],
  offices: [],
  channels: [],
};

/** Ambil satu bagian dari profil lengkap, dalam bentuk yang diterima editornya. */
export function pickCompanySection<K extends CompanyProfileSection>(
  profile: CompanyProfile,
  section: K,
): CompanySectionData<K> {
  return companyProfileSections[section].parse(
    Object.fromEntries(
      Object.keys(companyProfileSections[section].shape).map((key) => [
        key,
        profile[key as keyof CompanyProfile],
      ]),
    ),
  ) as CompanySectionData<K>;
}

const wahaGroupId = z
  .string()
  .trim()
  .regex(/^\d{5,24}(?:-\d{5,20})?@g\.us$/, 'Gunakan ID grup WAHA berakhiran @g.us.')
  .nullable();
export const waNotificationSettingsSchema = z.strictObject({
  orderCustomer: z.boolean(),
  orderGroup: wahaGroupId,
  careerGroup: wahaGroupId,
  digiposGroup: wahaGroupId,
});
export type WaNotificationSettings = z.infer<typeof waNotificationSettingsSchema>;
export const emptyWaNotificationSettings: WaNotificationSettings = {
  orderCustomer: false,
  orderGroup: null,
  careerGroup: null,
  digiposGroup: null,
};
export const waGatewayStatusSchema = z.object({
  configured: z.boolean(),
  notifications: waNotificationSettingsSchema,
});
export type WaGatewayStatus = z.infer<typeof waGatewayStatusSchema>;

/** Item navigasi per website. Menu milik modul bisnis terkunci: tidak bisa disembunyikan. */
export const navItemSchema = z.object({
  id: z.string().min(1).max(64),
  site: appIdSchema,
  label: z.string().trim().min(1).max(60),
  /** Hanya path internal; Admin Web tidak bisa menaruh tautan ke domain lain lewat navigasi. */
  href: z.string().regex(/^\/[A-Za-z0-9/_-]*$/, 'Tautan harus path internal, diawali "/".'),
  visible: z.boolean(),
  locked: z.boolean(),
});
export type NavItem = z.infer<typeof navItemSchema>;

/** Bagian halaman dari komponen yang sudah disediakan. Bukan editor kode bebas (PRD 2.4). */
export const layoutSectionSchema = z.object({
  id: z.string().min(1).max(64),
  page: z.string().min(1).max(60),
  label: z.string().min(1).max(80),
  component: z.string().min(1).max(60),
  visible: z.boolean(),
});
export type LayoutSection = z.infer<typeof layoutSectionSchema>;

export const siteAssetKindSchema = z.enum(['logo', 'foto', 'banner', 'ilustrasi']);
export type SiteAssetKind = z.infer<typeof siteAssetKindSchema>;

export const siteAssetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: siteAssetKindSchema,
  url: z.string().min(1),
  sizeKb: z.number().int().nonnegative(),
  uploadedAt: z.iso.datetime(),
});
export type SiteAsset = z.infer<typeof siteAssetSchema>;

export const auditEventSchema = z.object({
  id: z.string().min(1),
  at: z.iso.datetime(),
  actor: z.string(),
  action: z.string(),
  object: z.string(),
});
export type AuditEvent = z.infer<typeof auditEventSchema>;

/** Isian banner dari console. `id` kosong berarti banner baru. */
export const siteBannerInputSchema = siteBannerSchema
  .omit({ id: true })
  .extend({
    id: z.string().min(1).max(64).optional(),
    title: z.string().trim().min(1).max(120),
    subtitle: z.string().trim().max(240).nullable(),
    ctaLabel: z.string().trim().max(40).nullable(),
    ctaHref: z
      .string()
      .regex(/^(\/|https:\/\/)/, 'Tautan tombol harus path internal atau https.')
      .max(300)
      .nullable(),
  })
  .refine((banner) => banner.startsAt <= banner.endsAt, {
    message: 'Tanggal selesai tidak boleh sebelum tanggal mulai.',
    path: ['endsAt'],
  })
  .refine((banner) => (banner.ctaLabel === null) === (banner.ctaHref === null), {
    message: 'Label dan tautan tombol diisi keduanya atau dikosongkan keduanya.',
    path: ['ctaHref'],
  });
export type SiteBannerInput = z.infer<typeof siteBannerInputSchema>;
