import type { DataEnvelope } from '@agrabudi/contracts';
import type { OutletDataAdapter } from '../adapter';
import { mockCuanContact, mockCuanProducts } from '@agrabudi/ui/mock-cuan';
import { mockHandovers, mockOutletProfiles, mockPrograms, mockSiteSettings } from './fixtures';

/** Setiap respons mock membawa `source: "mock"` supaya UI wajib melabelinya. */
function asMock<T>(data: T): DataEnvelope<T> {
  return {
    data,
    meta: {
      source: 'mock',
      asOf: new Date().toISOString(),
      note: 'Data contoh untuk mencoba aplikasi Outlet. Bukan data resmi.',
    },
  };
}

export const mockAdapter: OutletDataAdapter = {
  getSiteSettings: async () => asMock(mockSiteSettings),
  listPrograms: async () => asMock(mockPrograms),
  getProgram: async (slug) => asMock(mockPrograms.find((program) => program.slug === slug) ?? null),
  listRewardHandovers: async () => asMock(mockHandovers),
  getOutletProfile: async (digiposId) =>
    asMock(mockOutletProfiles.find((profile) => profile.digiposId === digiposId) ?? null),
  listCuanProducts: async () => asMock(mockCuanProducts),
  getCuanContact: async () => asMock(mockCuanContact),
};
