import { z } from 'zod';
import { rupiahSchema } from './meta';

/** Paket/layanan IndiHome yang tampil di Publik. Dikelola Admin unit IndiHome. */
export const indihomePackageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  summary: z.string(),
  /** `null` berarti harga belum diterbitkan. */
  monthlyPriceRupiah: rupiahSchema.nullable(),
});
export type IndihomePackage = z.infer<typeof indihomePackageSchema>;
