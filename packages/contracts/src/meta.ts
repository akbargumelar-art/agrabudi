import { z } from 'zod';

/**
 * Asal data yang sedang ditampilkan. UI wajib menandai `mock` dan `cache`
 * supaya data contoh atau data lama tidak terbaca sebagai data resmi (PRD 3.3).
 */
export const dataSourceSchema = z.enum(['mock', 'api', 'cache']);
export type DataSource = z.infer<typeof dataSourceSchema>;

export const dataMetaSchema = z.object({
  source: dataSourceSchema,
  /** Waktu data diambil atau dibuat, ISO 8601 UTC. */
  asOf: z.iso.datetime(),
  note: z.string().optional(),
});
export type DataMeta = z.infer<typeof dataMetaSchema>;

export type DataEnvelope<T> = { data: T; meta: DataMeta };

export function envelopeSchema<T extends z.ZodType>(data: T) {
  return z.object({ data, meta: dataMetaSchema });
}

/** Uang disimpan sebagai integer rupiah, tidak pernah float (PRD 4.5). */
export const rupiahSchema = z.number().int().nonnegative();

/** Status publikasi untuk konten institusional maupun konten bisnis (PRD 2.11). */
export const contentStatusSchema = z.enum(['draft', 'review', 'published', 'archived']);
export type ContentStatus = z.infer<typeof contentStatusSchema>;
