import { outletSessionSchema } from '@agrabudi/contracts';
import { DEMO_OUTLET_PASSWORD, mockOutletProfiles } from '../data/mock/fixtures';
import { InvalidCredentialsError, type OutletAuthAdapter } from './adapter';

/**
 * AKUN CONTOH untuk mencoba aplikasi Outlet: CONTOH001, CONTOH002, CONTOH003.
 * Bukan outlet sungguhan dan tidak ikut ke build dengan sumber data `api`.
 */
export const mockAuthAdapter: OutletAuthAdapter = {
  signIn: async ({ digiposId, password }) => {
    const found = mockOutletProfiles.find(
      (profile) => profile.digiposId === digiposId.trim().toUpperCase(),
    );
    if (!found || password !== DEMO_OUTLET_PASSWORD) throw new InvalidCredentialsError();
    return outletSessionSchema.parse(found);
  },
};
