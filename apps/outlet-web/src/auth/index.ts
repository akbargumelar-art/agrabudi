import type { OutletAuthAdapter } from './adapter';
import { apiAuthAdapter } from './api';

let adapterPromise: Promise<OutletAuthAdapter> | undefined;

/** Akun contoh hanya dimuat bila VITE_DATA_SOURCE=mock; pada build `api` cabang ini dibuang bundler. */
export function getAuthAdapter(): Promise<OutletAuthAdapter> {
  if (!adapterPromise) {
    adapterPromise =
      import.meta.env.VITE_DATA_SOURCE === 'mock'
        ? import('./mock').then((module) => module.mockAuthAdapter)
        : Promise.resolve(apiAuthAdapter);
  }
  return adapterPromise;
}
