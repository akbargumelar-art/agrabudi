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

/** Host yang boleh disematkan sebagai halaman ABKShop. Mencegah halaman pihak lain ikut tampil. */
const EMBED_HOST_SUFFIXES = ['agrabudi.com', 'agrabudi.id'];

export function isAllowedEmbedUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;
  return EMBED_HOST_SUFFIXES.some(
    (suffix) => url.hostname === suffix || url.hostname.endsWith(`.${suffix}`),
  );
}

/**
 * Pengaturan website yang dikelola Admin Web. `abkshopEmbedUrl` adalah alamat halaman
 * pemesanan yang disematkan di menu ABKShop aplikasi Outlet.
 */
export const siteSettingsSchema = z.object({
  abkshopEmbedUrl: z
    .url('Alamat belum berbentuk URL yang benar.')
    .refine(
      isAllowedEmbedUrl,
      'Alamat harus https dan berada di domain agrabudi.com atau agrabudi.id.',
    ),
});
export type SiteSettings = z.infer<typeof siteSettingsSchema>;

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
      kind: z.enum(['whatsapp', 'phone', 'email', 'instagram']),
      label: z.string().min(1),
      value: z.string().min(1),
    }),
  ),
});
export type CompanyProfile = z.infer<typeof companyProfileSchema>;
