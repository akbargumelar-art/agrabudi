import {
  outletSessionSchema,
  passwordChangeSchema,
  passwordResetConfirmSchema,
  type OutletSession,
} from '@agrabudi/contracts';
import { DEMO_OUTLET_PASSWORD, mockOutletProfiles } from '../data/mock/fixtures';
import { FieldError, InvalidCredentialsError, type OutletAuthAdapter } from './adapter';

/**
 * AKUN CONTOH untuk mencoba aplikasi Outlet: CONTOH001, CONTOH002, CONTOH003.
 * Bukan outlet sungguhan dan tidak ikut ke build dengan sumber data `api`.
 * Mode contoh tidak mengirim WhatsApp; kode reset contoh tampil berlabel di halaman lupa akses.
 */
export const DEMO_OUTLET_RESET_CODE = '123456';

/** Perubahan kata sandi contoh hanya hidup selama halaman terbuka. */
const passwords = new Map<string, string>();
const passwordOf = (digiposId: string) => passwords.get(digiposId) ?? DEMO_OUTLET_PASSWORD;

function sessionOf(digiposId: string): OutletSession | null {
  const found = mockOutletProfiles.find((profile) => profile.digiposId === digiposId);
  return found ? outletSessionSchema.parse({ ...found, mustChangePassword: false }) : null;
}

export const mockAuthAdapter: OutletAuthAdapter = {
  signIn: async ({ digiposId, password }) => {
    const key = digiposId.trim().toUpperCase();
    const found = sessionOf(key);
    if (!found || password !== passwordOf(key)) throw new InvalidCredentialsError();
    return found;
  },
  changePassword: async (session, input) => {
    const parsed = passwordChangeSchema.safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const message = issue?.message ?? 'Isian belum sesuai.';
      throw new FieldError(message, { [String(issue?.path[0] ?? '_')]: message });
    }
    if (parsed.data.currentPassword !== passwordOf(session.digiposId)) {
      throw new FieldError('Kata sandi saat ini salah.', {
        currentPassword: 'Kata sandi saat ini salah.',
      });
    }
    passwords.set(session.digiposId, parsed.data.newPassword);
    return { ...session, mustChangePassword: false };
  },
  requestPasswordReset: async () => undefined,
  confirmPasswordReset: async (input) => {
    const { identifier, code, newPassword } = passwordResetConfirmSchema.parse(input);
    const key = identifier.trim().toUpperCase();
    if (!sessionOf(key) || code !== DEMO_OUTLET_RESET_CODE) {
      throw new FieldError('Kode salah atau sudah tidak berlaku. Minta kode baru bila perlu.', {
        code: 'Kode salah atau sudah tidak berlaku.',
      });
    }
    passwords.set(key, newPassword);
  },
  // Mode contoh menyimpan sesi kerangka di sessionStorage (lihat SessionContext).
  restore: async () => null,
  signOut: async () => undefined,
};
