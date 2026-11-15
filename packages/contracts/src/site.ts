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
