import { outletSessionSchema } from '@agrabudi/contracts';
import { ApiRequestError, apiRequest, apiRequestRaw } from '@agrabudi/contracts/http';
import { FieldError, InvalidCredentialsError, type OutletAuthAdapter } from './adapter';

const AUTH = '/api/v1/outlet/auth';

async function send(url: string, body: unknown): Promise<void> {
  try {
    await apiRequestRaw(url, { method: 'POST', body });
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 422) {
      throw new FieldError(error.message, error.fields);
    }
    throw error;
  }
}

/** Login Outlet lewat API. Sesi berupa cookie HttpOnly dari server; browser tidak menyimpan peran. */
export const apiAuthAdapter: OutletAuthAdapter = {
  changePassword: async (_session, input) => {
    await send(`${AUTH}/password`, input);
    return apiRequest(`${AUTH}/me`, outletSessionSchema);
  },
  requestPasswordReset: (digiposId) =>
    send(`${AUTH}/password-reset/request`, { identifier: digiposId }),
  confirmPasswordReset: (input) => send(`${AUTH}/password-reset/confirm`, input),
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
