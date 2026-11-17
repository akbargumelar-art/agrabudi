import { outletSessionSchema } from '@agrabudi/contracts';
import { ApiRequestError, apiRequest, apiRequestRaw } from '@agrabudi/contracts/http';
import { InvalidCredentialsError, type OutletAuthAdapter } from './adapter';

/** Login Outlet lewat API. Sesi berupa cookie HttpOnly dari server; browser tidak menyimpan peran. */
export const apiAuthAdapter: OutletAuthAdapter = {
  signIn: async ({ digiposId, password }) => {
    try {
      return await apiRequest('/api/v1/outlet/auth/login', outletSessionSchema, {
        method: 'POST',
        body: { digiposId, password },
      });
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401)
        throw new InvalidCredentialsError();
      throw error;
    }
  },
  restore: async () => {
    try {
      return await apiRequest('/api/v1/outlet/auth/me', outletSessionSchema);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) return null;
      throw error;
    }
  },
  signOut: async () => {
    await apiRequestRaw('/api/v1/outlet/auth/logout', { method: 'POST' });
  },
};
