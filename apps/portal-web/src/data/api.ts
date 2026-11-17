import { envelopeSchema, moduleDatasetSchema } from '@agrabudi/contracts';
import { ApiRequestError, apiRequest, apiRequestRaw } from '@agrabudi/contracts/http';
import { DataUnavailableError, ForbiddenError, type PortalDataAdapter } from './adapter';

/**
 * Adapter HTTP ke /api/v1/modules. Server memeriksa sesi dan izin pada setiap permintaan;
 * parameter `session` dari halaman tidak dikirim. Respons divalidasi dengan skema kontrak.
 */
const query = (path: string) => `path=${encodeURIComponent(path)}`;

function translate(error: unknown): never {
  if (error instanceof ApiRequestError) {
    if (error.status === 403) throw new ForbiddenError(error.message);
    if (error.status === 404) throw new DataUnavailableError(error.message);
    const firstField = Object.values(error.fields)[0];
    if (firstField) throw new Error(`${error.message} ${firstField}`, { cause: error });
  }
  throw error;
}

async function call(url: string, init?: Parameters<typeof apiRequestRaw>[1]) {
  try {
    return await apiRequestRaw(url, init);
  } catch (error) {
    return translate(error);
  }
}

export const apiAdapter: PortalDataAdapter = {
  getDataset: async (path) => {
    try {
      return await apiRequest(
        `/api/v1/modules?${query(path)}`,
        envelopeSchema(moduleDatasetSchema),
      );
    } catch (error) {
      return translate(error);
    }
  },
  saveRow: async (path, input) => {
    await call(`/api/v1/modules/rows?${query(path)}`, {
      method: 'POST',
      body: { id: input.id, cells: input.cells },
    });
  },
  deleteRow: async (path, rowId) => {
    await call(`/api/v1/modules/rows/${encodeURIComponent(rowId)}?${query(path)}`, {
      method: 'DELETE',
    });
  },
  importRows: async () => {
    throw new DataUnavailableError(
      'Unggah data untuk menu ini belum tersedia di server. Kolom dan aturannya menunggu kamus data.',
    );
  },
};
