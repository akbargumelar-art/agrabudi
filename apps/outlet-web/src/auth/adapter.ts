import type { OutletSession } from '@agrabudi/contracts';

/**
 * Login mitra outlet: ID Digipos dan kata sandi, seperti aplikasi poin-outlet lama.
 * Di produksi sesi dibuat server sebagai cookie HttpOnly (PRD 4.3).
 */
export interface OutletAuthAdapter {
  signIn(input: { digiposId: string; password: string }): Promise<OutletSession>;
  /** Sesi yang masih berlaku saat halaman dibuka, atau `null` bila belum masuk. */
  restore(): Promise<OutletSession | null>;
  /** Cabut sesi di server. */
  signOut(): Promise<void>;
}

export class AuthUnavailableError extends Error {
  readonly code = 'AUTH_NOT_CONNECTED';
  constructor(message: string) {
    super(message);
    this.name = 'AuthUnavailableError';
  }
}

export class InvalidCredentialsError extends Error {
  readonly code = 'INVALID_CREDENTIALS';
  constructor() {
    super('ID Digipos atau kata sandi salah.');
    this.name = 'InvalidCredentialsError';
  }
}
