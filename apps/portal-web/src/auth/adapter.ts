import type { StaffProfileUpdate, StaffSession } from '@agrabudi/contracts';

/**
 * Pintu autentikasi Portal. Satu form login untuk semua peran; peran ditentukan server
 * dari akun, bukan dipilih pengguna. Di produksi sesi adalah cookie HttpOnly dan browser
 * tidak pernah menentukan perannya sendiri (PRD 4.3, 4.6).
 */
export interface AuthAdapter {
  signIn(input: { username: string; password: string }): Promise<StaffSession>;
  /** Mengubah nama, email, dan nomor HP. Username, peran, dan cakupan tidak bisa diubah dari sini. */
  updateProfile(session: StaffSession, update: StaffProfileUpdate): Promise<StaffSession>;
  /** Sesi yang masih berlaku saat halaman dibuka (staff atau Admin Web), atau `null`. */
  restore(): Promise<StaffSession | null>;
  /** Cabut sesi di server, sesuai realm akun yang sedang masuk. */
  signOut(session: StaffSession): Promise<void>;
}

export class AuthUnavailableError extends Error {
  readonly code = 'AUTH_NOT_CONNECTED';
  constructor(message: string) {
    super(message);
    this.name = 'AuthUnavailableError';
  }
}

/** Pesan sengaja tidak membedakan username salah dan kata sandi salah. */
export class InvalidCredentialsError extends Error {
  readonly code = 'INVALID_CREDENTIALS';
  constructor() {
    super('Username atau kata sandi salah.');
    this.name = 'InvalidCredentialsError';
  }
}
