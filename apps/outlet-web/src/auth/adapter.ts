import type { OutletSession, PasswordChange, PasswordResetConfirm } from '@agrabudi/contracts';

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
  /** Ganti kata sandi sendiri. Sesi di perangkat lain dicabut; hasilnya sesi terbaru browser ini. */
  changePassword(session: OutletSession, input: PasswordChange): Promise<OutletSession>;
  /** Minta kode reset ke WhatsApp. Jawabannya tidak membedakan ada atau tidaknya akun. */
  requestPasswordReset(digiposId: string): Promise<void>;
  confirmPasswordReset(input: PasswordResetConfirm): Promise<void>;
}

/** Kegagalan isian dari server: pesan umum plus pesan per kolom. */
export class FieldError extends Error {
  readonly code = 'FIELD_ERROR';
  constructor(
    message: string,
    readonly fields: Record<string, string>,
  ) {
    super(message);
    this.name = 'FieldError';
  }
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
