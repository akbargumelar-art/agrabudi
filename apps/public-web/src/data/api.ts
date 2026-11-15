import { DataUnavailableError, type PublicDataAdapter } from './adapter';

/** API publik (/api/public/v1) dibangun di M2-M3. Sampai saat itu permintaan gagal dengan pesan yang jujur. */
function notConnected(): never {
  throw new DataUnavailableError(
    'Layanan data website belum terhubung. Bagian ini tampil setelah API publik tersedia.',
  );
}

export const apiAdapter: PublicDataAdapter = {
  listProducts: async () => notConnected(),
  getProduct: async () => notConnected(),
  listPrograms: async () => notConnected(),
  getProgram: async () => notConnected(),
  listVacancies: async () => notConnected(),
  getVacancy: async () => notConnected(),
  listIndihomePackages: async () => notConnected(),
  listBanners: async () => notConnected(),
};
