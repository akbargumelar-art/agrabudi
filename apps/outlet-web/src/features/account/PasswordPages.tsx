import {
  PASSWORD_RESET_CODE_TTL_MINUTES,
  newPasswordSchema,
  type PasswordChange,
} from '@agrabudi/contracts';
import {
  Button,
  DataNotice,
  ErrorState,
  Field,
  Input,
  LoadingBlock,
  PageHeader,
  StatusBadge,
  cardClass,
  cn,
} from '@agrabudi/ui';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { usesMockData } from '../../app/env';
import { getAuthAdapter } from '../../auth';
import { FieldError } from '../../auth/adapter';
import { useOutletSession } from '../../auth/SessionContext';

type Errors = Record<string, string>;

function errorsOf(cause: unknown): { message: string; fields: Errors } {
  if (cause instanceof FieldError) return { message: cause.message, fields: cause.fields };
  return {
    message: cause instanceof Error ? cause.message : 'Permintaan gagal. Coba lagi beberapa saat.',
    fields: {},
  };
}

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
        hint="Minimal 12 karakter."
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
      <Field
        label="Ulangi kata sandi baru"
        htmlFor={`${prefix}-ulang`}
        error={errors.repeatPassword}
      >
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

/** Form ganti kata sandi: halaman wajib ganti dan halaman Akun. */
export function ChangePasswordForm({
  currentLabel,
  submitLabel,
  onDone,
}: {
  currentLabel: string;
  submitLabel: string;
  onDone: () => void;
}) {
  const { session, signIn } = useOutletSession();
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    const element = event.currentTarget;
    const form = new FormData(element);
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
      signIn(await (await getAuthAdapter()).changePassword(session, input));
      element.reset();
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

/** Kata sandi sementara dari WhatsApp wajib diganti; server menolak API lain sampai diganti. */
export function ForceChangePasswordPage() {
  const { session, status, signOut } = useOutletSession();
  const navigate = useNavigate();
  if (!session && status === 'checking') return <LoadingBlock label="Memeriksa sesi" />;
  if (!session) return <Navigate to="/login" replace />;
  if (!session.mustChangePassword) return <Navigate to="/" replace />;
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <PageHeader
        title="Buat kata sandi baru"
        description="Akun Anda masih memakai kata sandi sementara dari WhatsApp. Ganti dulu sebelum belanja atau melihat pesanan."
      />
      <ChangePasswordForm
        currentLabel="Kata sandi sementara"
        submitLabel="Simpan dan lanjutkan"
        onDone={() => navigate('/', { replace: true })}
      />
      <Button variant="ghost" onClick={() => void signOut()}>
        Keluar
      </Button>
    </div>
  );
}

/**
 * Lupa kata sandi Outlet (sebelum login): kode 6 angka ke WhatsApp yang tercatat di akun outlet.
 * Langkah 1 selalu menampilkan pesan yang sama supaya ID Digipos tidak bisa ditebak.
 */
export function RecoverAccessPage() {
  const { session } = useOutletSession();
  const navigate = useNavigate();
  const [digiposId, setDigiposId] = useState('');
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/akun" replace />;

  async function onRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get('digiposId') ?? '')
      .trim()
      .toUpperCase();
    if (!value) {
      setErrors({ identifier: 'ID Digipos wajib diisi.' });
      return;
    }
    setErrors({});
    setFailure(null);
    setBusy(true);
    try {
      await (await getAuthAdapter()).requestPasswordReset(value);
      setDigiposId(value);
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
      await (await getAuthAdapter()).confirmPasswordReset({
        identifier: digiposId,
        code,
        newPassword,
      });
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
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <PageHeader
        title="Pulihkan akses akun"
        description="Kode reset dikirim lewat WhatsApp ke nomor HP yang tercatat di akun outlet."
      />
      {failure ? <ErrorState title="Belum bisa reset" description={failure} /> : null}
      {step === 'request' ? (
        <form className="flex flex-col gap-4" onSubmit={onRequest} noValidate>
          <Field label="ID Digipos" htmlFor="pulih-id" error={errors.identifier}>
            <Input
              id="pulih-id"
              name="digiposId"
              autoComplete="username"
              autoCapitalize="characters"
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
              Bila ID Digipos <strong>{digiposId}</strong> terdaftar dan punya nomor WhatsApp, kode
              6 angka sudah dikirim. Kode berlaku {PASSWORD_RESET_CODE_TTL_MINUTES} menit.
            </p>
            {usesMockData ? (
              <p className="flex flex-wrap items-center gap-2">
                <DataNotice meta={{ source: 'mock', asOf: new Date().toISOString() }} />
                Mode contoh tidak mengirim WhatsApp. Pakai kode 123456.
              </p>
            ) : null}
          </div>
          <Field label="Kode dari WhatsApp" htmlFor="pulih-kode" error={errors.code}>
            <Input
              id="pulih-kode"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              aria-invalid={Boolean(errors.code)}
              required
            />
          </Field>
          <NewPasswordFields prefix="pulih" errors={errors} />
          <Button type="submit" block disabled={busy}>
            {busy ? 'Menyimpan…' : 'Simpan kata sandi baru'}
          </Button>
          <Button variant="ghost" onClick={() => setStep('request')}>
            Kirim ulang kode
          </Button>
        </form>
      )}
      <p className="text-sm text-ink-700">
        Nomor WhatsApp outlet belum tercatat atau sudah ganti? Hubungi salesforce atau Admin untuk
        reset kata sandi.
      </p>
      <Link to="/login" className="text-sm font-medium text-info underline">
        Kembali ke halaman masuk
      </Link>
    </div>
  );
}

