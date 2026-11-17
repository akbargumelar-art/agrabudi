import { AppSwitcher, Button, ErrorState, Field, Input, Wordmark } from '@agrabudi/ui';
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { appUrls } from '../app/env';
import { StageNotice } from '../app/StageNotice';
import { getAuthAdapter } from './index';
import { useSessionApi } from './SessionContext';

function targetAfterLogin(state: unknown): string {
  if (typeof state === 'object' && state !== null && 'from' in state) {
    const from = (state as { from: unknown }).from;
    if (typeof from === 'string' && from.startsWith('/') && from !== '/login') return from;
  }
  return '/';
}

/**
 * Halaman pertama Portal: username dan kata sandi saja. Tidak ada pilihan peran;
 * sistem membuka menu sesuai peran akun yang masuk.
 */
export function LoginPage() {
  const { session, status, signIn } = useSessionApi();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to={targetAfterLogin(location.state)} replace />;
  if (status === 'checking') return null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const adapter = await getAuthAdapter();
      signIn(
        await adapter.signIn({
          username: String(form.get('username') ?? ''),
          password: String(form.get('password') ?? ''),
        }),
      );
      navigate(targetAfterLogin(location.state), { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Login gagal. Coba lagi beberapa saat.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <AppSwitcher active="portal" urls={appUrls} />
      <StageNotice />
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10 tablet:py-16">
        <div>
          <Wordmark app="Portal" />
          <h1 className="mt-6 text-3xl font-extrabold">Masuk ke Portal</h1>
          <p className="mt-2 text-ink-700">Masuk dengan akun karyawan Anda.</p>
        </div>

        {error ? <ErrorState title="Belum bisa masuk" description={error} /> : null}

        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <Field label="Username" htmlFor="login-username">
            <Input
              id="login-username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              required
            />
          </Field>
          <Field label="Kata sandi" htmlFor="login-sandi">
            <Input
              id="login-sandi"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </Field>
          <Button type="submit" block disabled={busy}>
            Masuk
          </Button>
        </form>
      </main>
    </>
  );
}
