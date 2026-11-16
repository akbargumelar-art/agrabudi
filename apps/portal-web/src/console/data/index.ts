import type { WebAdminDataAdapter } from './adapter';
import { apiAdapter } from './api';

let adapterPromise: Promise<WebAdminDataAdapter> | undefined;

/** Mock hanya dimuat bila VITE_DATA_SOURCE=mock; pada build `api` cabang ini dibuang bundler. */
export function getAdapter(): Promise<WebAdminDataAdapter> {
  if (!adapterPromise) {
    adapterPromise =
      import.meta.env.VITE_DATA_SOURCE === 'mock'
        ? import('./mock/adapter').then((module) => module.mockAdapter)
        : Promise.resolve(apiAdapter);
  }
  return adapterPromise;
}
