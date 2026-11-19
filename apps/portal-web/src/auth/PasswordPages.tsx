import {
  PASSWORD_RESET_CODE_TTL_MINUTES,
  newPasswordSchema,
  type PasswordChange,
} from '@agrabudi/contracts';
import {
  AppSwitcher,
  Button,
  DataNotice,
  ErrorState,
  Field,
  Input,
  StatusBadge,
  Wordmark,
  cardClass,
  cn,
} from '@agrabudi/ui';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { appUrls, usesMockData } from '../app/env';
import { StageNotice } from '../app/StageNotice';
import { FieldError } from './adapter';
import { getAuthAdapter } from './index';
import { useSessionApi } from './SessionContext';

type Errors = Record<string, string>;

function errorsOf(cause: unknown): { message: string; fields: Errors } {
  if (cause instanceof FieldError) return { message: cause.message, fields: cause.fields };
  return {
    message: cause instanceof Error ? cause.message : 'Permintaan gagal. Coba lagi beberapa saat.',
    fields: {},
  };
}

/** Kata sandi baru diketik dua kali; aturan panjangnya dari kontrak yang sama dengan server. */
function checkNewPassword(next: string, repeat: string): Errors {
  const parsed = newPasswordSchema.safeParse(next);
  if (!parsed.success) return { newPassword: parsed.error.issues[0]?.message ?? 'Belum sesuai.' };
  if (next !== repeat) return { repeatPassword: 'Ulangi kata sandi baru dengan isi yang sama.' };
  return {};
}

function NewPasswordFields({ prefix, errors }: { prefix: string; errors: Errors }) {
  return (
    <>
      <Field
        label="Kata sandi baru"
        htmlFor={`${prefix}-baru`}
        hint="Minimal 6 karakter. Boleh berupa kalimat yang mudah Anda ingat."
        error={errors.newPassword}
      >
        <Input
          id={`${prefix}-baru`}
          name="newPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.newPassword)}
          required
        />
      </Field>
      <Field label="Ulangi kata sandi baru" htmlFor={`${prefix}-ulang`} error={errors.repeatPassword}>
        <Input
          id={`${prefix}-ulang`}
          name="repeatPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.repeatPassword)}
          required
        />
      </Field>
    </>
  );
}

/**
 * Form ganti kata sandi bersama: halaman wajib ganti (kata sandi sementara) dan halaman Akun.
 * `onDone` dipanggil setelah server menerima kata sandi baru.
 */
export function ChangePasswordForm({
  submitLabel,
  currentLabel,
  onDone,
}: {
  submitLabel: string;
  currentLabel: string;
  onDone: () => void;
}) {
  const { session, signIn } = useSessionApi();
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const input: PasswordChange = {
      currentPassword: String(form.get('currentPassword') ?? ''),
      newPassword: String(form.get('newPassword') ?? ''),
    };
    const local = checkNewPassword(input.newPassword, String(form.get('repeatPassword') ?? ''));
    if (!input.currentPassword) local.currentPassword = 'Kata sandi saat ini wajib diisi.';
    setErrors(local);
    setFailure(null);
    if (Object.keys(local).length > 0) return;
    setBusy(true);
    try {
      const adapter = await getAuthAdapter();
      signIn(await adapter.changePassword(session, input));
      formElement.reset();
      onDone();
    } catch (cause) {
      const { message, fields } = errorsOf(cause);
      setErrors(fields);
      if (Object.keys(fields).length === 0) setFailure(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
      <Field label={currentLabel} htmlFor="sandi-sekarang" error={errors.currentPassword}>
        <Input
          id="sandi-sekarang"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.currentPassword)}
          required
        />
      </Field>
      <NewPasswordFields prefix="sandi" errors={errors} />
      {failure ? <ErrorState title="Kata sandi belum diganti" description={failure} /> : null}
      <div>
        <Button type="submit" disabled={busy}>
          {busy ? 'Menyimpan…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

/** Kerangka halaman di luar menu Portal: login, lupa kata sandi, dan ganti kata sandi wajib. */
function AuthFrame({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <>
      <AppSwitcher active="portal" urls={appUrls} />
      <StageNotice />
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10 tablet:py-16">
        <div>
          <Wordmark app="Portal" />
          <h1 className="mt-6 text-3xl font-extrabold">{title}</h1>
          <p className="mt-2 text-ink-700">{intro}</p>
        </div>
        {children}
      </main>
    </>
  );
}

/**
 * Login pertama atau setelah direset admin: kata sandi sementara wajib diganti. Server menolak
 * semua API lain sampai diganti, jadi halaman ini bukan sekadar pengalihan tampilan.
 */
export function ForceChangePasswordPage() {
  const { session, status, signOut } = useSessionApi();
  const navigate = useNavigate();
  if (status === 'checking') return null;
  if (!session) return <Navigate to="/login" replace />;
  if (!session.mustChangePassword) return <Navigate to="/" replace />;
  return (
    <AuthFrame
      title="Buat kata sandi baru"
      intro="Akun Anda masih memakai kata sandi sementara dari WhatsApp. Ganti dulu sebelum memakai Portal."
    >
      <ChangePasswordForm
        currentLabel="Kata sandi sementara"
        submitLabel="Simpan dan lanjutkan"
        onDone={() => navigate('/', { replace: true })}
      />
      <Button variant="ghost" onClick={() => void signOut()}>
        Keluar
      </Button>
    </AuthFrame>
  );
}

/**
 * Lupa kata sandi (sebelum login): kode 6 angka dikirim ke WhatsApp yang tercatat di akun.
 * Langkah 1 selalu menampilkan pesan yang sama supaya tidak ada yang bisa menebak username.
 */
export function ForgotPasswordPage() {
  const { session } = useSessionApi();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/" replace />;

  async function onRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get('identifier') ?? '').trim();
    if (!value) {
      setErrors({ identifier: 'Username wajib diisi.' });
      return;
    }
    setErrors({});
    setFailure(null);
    setBusy(true);
    try {
      await (await getAuthAdapter()).requestPasswordReset(value);
      setIdentifier(value);
      setStep('confirm');
    } catch (cause) {
      setFailure(errorsOf(cause).message);
    } finally {
      setBusy(false);
    }
  }

  async function onConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const code = String(form.get('code') ?? '').trim();
    const newPassword = String(form.get('newPassword') ?? '');
    const local = checkNewPassword(newPassword, String(form.get('repeatPassword') ?? ''));
    if (!/^\d{6}$/.test(code)) local.code = 'Kode terdiri dari 6 angka.';
    setErrors(local);
    setFailure(null);
    if (Object.keys(local).length > 0) return;
    setBusy(true);
    try {
      await (await getAuthAdapter()).confirmPasswordReset({ identifier, code, newPassword });
      navigate('/login', { replace: true, state: { notice: 'password-reset' } });
    } catch (cause) {
      const { message, fields } = errorsOf(cause);
      setErrors(fields);
      if (Object.keys(fields).length === 0) setFailure(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthFrame
      title="Lupa kata sandi"
      intro="Kode reset dikirim lewat WhatsApp ke nomor HP yang tercatat di akun Anda."
    >
      {failure ? <ErrorState title="Belum bisa reset" description={failure} /> : null}
      {step === 'request' ? (
        <form className="flex flex-col gap-4" onSubmit={onRequest} noValidate>
          <Field label="Username" htmlFor="lupa-username" error={errors.identifier}>
            <Input
              id="lupa-username"
              name="identifier"
              autoComplete="username"
              autoCapitalize="none"
              aria-invalid={Boolean(errors.identifier)}
              required
            />
          </Field>
          <Button type="submit" block disabled={busy}>
            {busy ? 'Mengirim…' : 'Kirim kode ke WhatsApp'}
          </Button>
        </form>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={onConfirm} noValidate>
          <div className={cn(cardClass, 'flex flex-col gap-2 p-4 text-sm')} role="status">
            <StatusBadge tone="info">Cek WhatsApp Anda</StatusBadge>
            <p>
              Bila username <strong>{identifier}</strong> terdaftar dan punya nomor WhatsApp, kode 6
              angka sudah dikirim. Kode berlaku {PASSWORD_RESET_CODE_TTL_MINUTES} menit.
            </p>
            {usesMockData ? <MockCodeHint /> : null}
          </div>
          <Field label="Kode dari WhatsApp" htmlFor="lupa-kode" error={errors.code}>
            <Input
              id="lupa-kode"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              aria-invalid={Boolean(errors.code)}
              required
            />
          </Field>
          <NewPasswordFields prefix="lupa" errors={errors} />
          <Button type="submit" block disabled={busy}>
            {busy ? 'Menyimpan…' : 'Simpan kata sandi baru'}
          </Button>
          <Button variant="ghost" onClick={() => setStep('request')}>
            Kirim ulang kode
          </Button>
        </form>
      )}
      <p className="text-sm text-ink-700">
        Tidak punya nomor WhatsApp di akun? Minta Admin yang mengelola akun Anda untuk mereset
        kata sandi.
      </p>
      <Link to="/login" className="text-sm font-medium text-info underline">
        Kembali ke halaman masuk
      </Link>
    </AuthFrame>
  );
}

/** Hanya di mode contoh: WhatsApp tidak dikirim, jadi kodenya diberi tahu dengan label. */
function MockCodeHint() {
  return (
    <p className="flex flex-wrap items-center gap-2">
      <DataNotice meta={{ source: 'mock', asOf: new Date().toISOString() }} />
      Mode contoh tidak mengirim WhatsApp. Pakai kode 123456.
    </p>
  );
}

