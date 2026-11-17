import { staffSessionSchema, type StaffSession } from '@agrabudi/contracts';
import { ApiRequestError, apiRequest, apiRequestRaw } from '@agrabudi/contracts/http';
import { InvalidCredentialsError, type AuthAdapter } from './adapter';

/**
 * Login Portal lewat API. Satu form; server menentukan realm dari akun: akun Admin Web
 * mendapat sesi terpisah di /web-admin (PRD 4.3). Browser tidak menyimpan peran.
 */
const STAFF = '/api/v1/auth';
const WEB_ADMIN = '/web-admin/api/v1/auth';
const realmBase = (session: Pick<StaffSession, 'role'>) =>
  session.role === 'web_admin' ? WEB_ADMIN : STAFF;

async function me(base: string): Promise<StaffSession | null> {
  try {
    return await apiRequest(`${base}/me`, staffSessionSchema);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) return null;
    throw error;
  }
}

export const apiAuthAdapter: AuthAdapter = {
  signIn: async ({ username, password }) => {
    try {
      return await apiRequest(`${STAFF}/login`, staffSessionSchema, {
        method: 'POST',
        body: { username, password },
      });
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401)
        throw new InvalidCredentialsError();
      throw error;
    }
  },
  updateProfile: (session, update) =>
    apiRequest(`${realmBase(session)}/profile`, staffSessionSchema, {
      method: 'PATCH',
      body: update,
    }),
  restore: async () => (await me(STAFF)) ?? (await me(WEB_ADMIN)),
  signOut: async (session) => {
    await apiRequestRaw(`${realmBase(session)}/logout`, { method: 'POST' });
  },
};
