import type { DataEnvelope } from '@agrabudi/contracts';
import type { OutletDataAdapter } from '../adapter';
import { mockCatalog, mockHandovers, mockOrders, mockPrograms } from './fixtures';

/** Setiap respons mock membawa `source: "mock"` supaya UI wajib melabelinya. */
function asMock<T>(data: T): DataEnvelope<T> {
  return {
    data,
    meta: {
      source: 'mock',
      asOf: new Date().toISOString(),
      note: 'Data contoh untuk kerangka tampilan Outlet. Bukan data resmi.',
    },
  };
}

export const mockAdapter: OutletDataAdapter = {
  getCatalog: async () => asMock(mockCatalog),
  listOrders: async () => asMock(mockOrders),
  getOrder: async (id) => asMock(mockOrders.find((order) => order.id === id) ?? null),
  listPrograms: async () => asMock(mockPrograms),
  getProgram: async (slug) => asMock(mockPrograms.find((program) => program.slug === slug) ?? null),
  listRewardHandovers: async () => asMock(mockHandovers),
};
