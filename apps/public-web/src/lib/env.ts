import { appUrlsSchema, type AppUrls } from '@agrabudi/contracts';

/** URL tiga aplikasi selalu dari environment (PRD US-01). */
export const appUrls: AppUrls = appUrlsSchema.parse({
  public: process.env.NEXT_PUBLIC_APP_URL_PUBLIC,
  outlet: process.env.NEXT_PUBLIC_APP_URL_OUTLET,
  portal: process.env.NEXT_PUBLIC_APP_URL_PORTAL,
});

/** Mock hanya aktif bila diminta eksplisit. Nilai lain dianggap `api`. */
export const usesMockData = process.env.NEXT_PUBLIC_DATA_SOURCE === 'mock';
