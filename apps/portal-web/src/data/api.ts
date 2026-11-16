import { DataUnavailableError, type PortalDataAdapter } from './adapter';

/** API modul Portal dibangun di M2 dan seterusnya. Sampai saat itu permintaan gagal dengan pesan yang jujur. */
function notConnected(): never {
  throw new DataUnavailableError(
    'Layanan data Portal belum terhubung. Halaman ini aktif setelah backend tersedia.',
  );
}

export const apiAdapter: PortalDataAdapter = {
  getDataset: async () => notConnected(),
  saveRow: async () => notConnected(),
  deleteRow: async () => notConnected(),
  importRows: async () => notConnected(),
};
