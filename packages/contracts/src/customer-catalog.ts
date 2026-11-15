import { z } from 'zod';
import { contentStatusSchema, rupiahSchema } from './meta';

/** Kategori ABKShop Pelanggan (PRD 2.6). Terpisah dari katalog Outlet (K-06). */
export const customerCategorySchema = z.enum(['perdana', 'voucher', 'orbit', 'soundbox']);
export type CustomerCategory = z.infer<typeof customerCategorySchema>;

export const customerProductSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  channel: z.literal('customer'),
  name: z.string().min(1),
  category: customerCategorySchema,
  summary: z.string(),
  terms: z.array(z.string()),
  /** `null` berarti harga belum diterbitkan. Tidak boleh diisi dari harga Outlet. */
  priceRupiah: rupiahSchema.nullable(),
  imageUrl: z.string().nullable(),
  status: contentStatusSchema,
});
export type CustomerProduct = z.infer<typeof customerProductSchema>;
