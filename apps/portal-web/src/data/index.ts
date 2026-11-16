import type { PortalDataAdapter } from './adapter';
import { apiAdapter } from './api';

let adapterPromise: Promise<PortalDataAdapter> | undefined;

/** Data contoh hanya dimuat bila VITE_DATA_SOURCE=mock; pada build `api` cabang ini dibuang bundler. */
export function getPortalAdapter(): Promise<PortalDataAdapter> {
  if (!adapterPromise) {
    adapterPromise =
      import.meta.env.VITE_DATA_SOURCE === 'mock'
        ? import('./mock/adapter').then((module) => module.mockPortalAdapter)
        : Promise.resolve(apiAdapter);
  }
  return adapterPromise;
}
