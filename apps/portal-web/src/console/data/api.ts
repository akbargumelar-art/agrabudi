import { DataUnavailableError, type WebAdminDataAdapter } from './adapter';

/** CMS API (/web-admin/api) dibangun di M2-M3. Sampai saat itu permintaan gagal dengan pesan yang jujur. */
function notConnected(): never {
  throw new DataUnavailableError(
    'Layanan konten website belum terhubung. Halaman ini aktif setelah CMS API tersedia.',
  );
}

export const apiAdapter: WebAdminDataAdapter = {
  listPages: async () => notConnected(),
  updatePageStatus: async () => notConnected(),
  listBanners: async () => notConnected(),
  saveBanner: async () => notConnected(),
  deleteBanner: async () => notConnected(),
  listPublications: async () => notConnected(),
  getSiteSettings: async () => notConnected(),
  updateSiteSettings: async () => notConnected(),
  listNavigation: async () => notConnected(),
  saveNavigation: async () => notConnected(),
  listLayouts: async () => notConnected(),
  saveLayouts: async () => notConnected(),
  listAssets: async () => notConnected(),
  addAsset: async () => notConnected(),
  deleteAsset: async () => notConnected(),
  listAudit: async () => notConnected(),
};
