import { AuthUnavailableError, type OutletAuthAdapter } from './adapter';

export const apiAuthAdapter: OutletAuthAdapter = {
  signIn: async () => {
    throw new AuthUnavailableError(
      'Layanan login Outlet belum terhubung. Login aktif setelah backend tersedia.',
    );
  },
};
