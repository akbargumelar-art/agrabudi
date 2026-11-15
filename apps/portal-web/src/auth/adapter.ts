import type { StaffSession } from '@agrabudi/contracts';

export type DemoAccount = {
  session: StaffSession;
  /** Ringkasan singkat apa yang dilihat akun ini. */
  summary: string;
};

/**
 * Pintu autentikasi Portal. Di produksi sesi dibuat server dan disimpan sebagai
 * cookie HttpOnly; browser tidak pernah menentukan role-nya sendiri (PRD 4.3, 4.6).
 */
export interface AuthAdapter {
  signIn(input: { identifier: string; password: string }): Promise<StaffSession>;
  /** Hanya terisi pada mock adapter. Build `api` tidak memuat akun contoh. */
  demoAccounts: DemoAccount[];
  signInAsDemo(accountId: string): Promise<StaffSession>;
}

export class AuthUnavailableError extends Error {
  readonly code = 'AUTH_NOT_CONNECTED';
  constructor(message: string) {
    super(message);
    this.name = 'AuthUnavailableError';
  }
}
