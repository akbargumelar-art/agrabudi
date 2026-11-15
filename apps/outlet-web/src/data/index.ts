import type { OutletDataAdapter } from './adapter';
import { apiAdapter } from './api';

let adapterPromise: Promise<OutletDataAdapter> | undefined;

/**
 * Mock dimuat lewat import dinamis dan hanya bila VITE_DATA_SOURCE=mock.
 * Pada build dengan sumber `api`, cabang ini dibuang bundler sehingga
 * data contoh tidak ikut ke bundle.
 */
export function getAdapter(): Promise<OutletDataAdapter> {
  if (!adapterPromise) {
    adapterPromise =
      import.meta.env.VITE_DATA_SOURCE === 'mock'
        ? import('./mock/adapter').then((module) => module.mockAdapter)
        : Promise.resolve(apiAdapter);
  }
  return adapterPromise;
}
