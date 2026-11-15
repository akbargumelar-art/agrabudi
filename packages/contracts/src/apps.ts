import { z } from 'zod';

/** Tiga aplikasi tingkat 1 (PRD K-01, K-02). Karir bagian dari `public`. */
export const appIdSchema = z.enum(['public', 'outlet', 'portal']);
export type AppId = z.infer<typeof appIdSchema>;

/**
 * URL dasar tiap aplikasi. Selalu diisi dari environment supaya staging
 * tidak melompat ke produksi (PRD US-01).
 */
export const appUrlsSchema = z.object({
  public: z.url(),
  outlet: z.url(),
  portal: z.url(),
});
export type AppUrls = z.infer<typeof appUrlsSchema>;
