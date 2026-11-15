import { z } from 'zod';
import { rupiahSchema } from './meta';

export const outletCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});
export type OutletCategory = z.infer<typeof outletCategorySchema>;

/**
 * Paket ABKShop Outlet (PRD 2.7). Aturan jumlah berasal dari produk:
 * nol berarti tidak dipilih, selain itu harus memenuhi minimum, maksimum,
 * dan kelipatan.
 */
export const outletPackageSchema = z.object({
  id: z.string().min(1),
  channel: z.literal('outlet'),
  name: z.string().min(1),
  description: z.string(),
  contents: z.string(),
  categoryId: z.string().min(1),
  unitPriceRupiah: rupiahSchema,
  minQty: z.number().int().positive(),
  maxQty: z.number().int().positive().nullable(),
  multipleOf: z.number().int().positive(),
  thumbnailUrl: z.string().nullable(),
});
export type OutletPackage = z.infer<typeof outletPackageSchema>;

export const outletCatalogSchema = z.object({
  categories: z.array(outletCategorySchema),
  packages: z.array(outletPackageSchema),
});
export type OutletCatalog = z.infer<typeof outletCatalogSchema>;
