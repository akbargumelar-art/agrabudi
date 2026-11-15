import type { DataEnvelope } from '@agrabudi/contracts';
import { DataUnavailableError, type PublicDataAdapter } from './adapter';
import { apiAdapter } from './api';

/** Mock hanya dimuat bila NEXT_PUBLIC_DATA_SOURCE=mock; pada build `api` cabang ini dibuang bundler. */
async function getAdapter(): Promise<PublicDataAdapter> {
  if (process.env.NEXT_PUBLIC_DATA_SOURCE === 'mock') {
    const { mockAdapter } = await import('./mock/adapter');
    return mockAdapter;
  }
  return apiAdapter;
}

export type Loaded<T> =
  { ok: true; data: T; meta: DataEnvelope<T>['meta'] } | { ok: false; message: string };

/**
 * Ambil data untuk satu bagian halaman. Sumber data yang belum terhubung
 * dikembalikan sebagai gagal supaya bagian itu menampilkan pesan gangguan,
 * bukan data contoh. Error lain diteruskan ke error boundary.
 */
export async function load<T>(
  request: (adapter: PublicDataAdapter) => Promise<DataEnvelope<T>>,
): Promise<Loaded<T>> {
  try {
    const envelope = await request(await getAdapter());
    return { ok: true, data: envelope.data, meta: envelope.meta };
  } catch (error) {
    if (error instanceof DataUnavailableError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }
}
