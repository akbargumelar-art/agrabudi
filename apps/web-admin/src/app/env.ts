import { appUrlsSchema, type AppUrls } from '@agrabudi/contracts';

/** URL tiga aplikasi selalu dari environment (PRD US-01). */
export const appUrls: AppUrls = appUrlsSchema.parse({
  public: import.meta.env.VITE_APP_URL_PUBLIC,
  outlet: import.meta.env.VITE_APP_URL_OUTLET,
  portal: import.meta.env.VITE_APP_URL_PORTAL,
});

/** Mock hanya aktif bila diminta eksplisit. Nilai lain dianggap `api`. */
export const usesMockData = import.meta.env.VITE_DATA_SOURCE === 'mock';
