import { z } from 'zod';
import { rupiahSchema } from './meta';

/** Paket/layanan IndiHome yang tampil di Publik. Dikelola Admin unit IndiHome. */
export const indihomePackageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  summary: z.string(),
  /** `null` berarti harga belum diterbitkan. */
  monthlyPriceRupiah: rupiahSchema.nullable(),
  /** Isi paket singkat, mis. kecepatan atau layanan tambahan. */
  features: z.array(z.string()),
  imageUrl: z.string().nullable(),
});
export type IndihomePackage = z.infer<typeof indihomePackageSchema>;

/** Syarat pemasangan dan tanya-jawab IndiHome. Isi bisnis milik Admin unit IndiHome. */
export const indihomeInfoSchema = z.object({
  requirements: z.array(z.string()),
  faqs: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })),
});
export type IndihomeInfo = z.infer<typeof indihomeInfoSchema>;

/** Syarat dan langkah pendaftaran Digipos. Isi bisnis milik Admin layanan Digipos. */
export const digiposInfoSchema = z.object({
  requirements: z.array(z.string()),
  steps: z.array(z.string()),
});
export type DigiposInfo = z.infer<typeof digiposInfoSchema>;
