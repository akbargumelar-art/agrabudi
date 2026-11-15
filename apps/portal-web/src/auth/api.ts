import { AuthUnavailableError, type AuthAdapter } from './adapter';

/** Layanan login dibangun di M2. Sampai saat itu login gagal dengan pesan yang jujur. */
function notConnected(): never {
  throw new AuthUnavailableError(
    'Layanan login Portal belum terhubung. Login aktif setelah backend tersedia.',
  );
}

export const apiAuthAdapter: AuthAdapter = {
  signIn: async () => notConnected(),
  demoAccounts: [],
  signInAsDemo: async () => notConnected(),
};
