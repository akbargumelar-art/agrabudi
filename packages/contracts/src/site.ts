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
    z.object({
      name: z.string().min(1),
      districts: z.array(z.string()),
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
  channels: z.array(
    z.object({
      kind: z.enum(['whatsapp', 'phone', 'email', 'instagram', 'facebook', 'website']),
      label: z.string().min(1),
      value: z.string().min(1),
    }),
  ),
});
export type CompanyProfile = z.infer<typeof companyProfileSchema>;

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
