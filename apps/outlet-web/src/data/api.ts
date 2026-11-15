import { DataUnavailableError, type OutletDataAdapter } from './adapter';

/**
 * Adapter HTTP belum ada: backend Outlet dibangun di M2-M4.
 * Sampai saat itu setiap permintaan gagal dengan pesan yang jujur,
 * bukan diam-diam memakai data contoh.
 */
function notConnected(): never {
  throw new DataUnavailableError(
    'Layanan data Outlet belum terhubung. Halaman ini aktif setelah backend tersedia.',
  );
}

export const apiAdapter: OutletDataAdapter = {
  getCatalog: async () => notConnected(),
  listOrders: async () => notConnected(),
  getOrder: async () => notConnected(),
  listPrograms: async () => notConnected(),
  getProgram: async () => notConnected(),
  listRewardHandovers: async () => notConnected(),
};
