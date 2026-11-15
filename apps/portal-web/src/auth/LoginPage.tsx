import {
  AppSwitcher,
  Button,
  DataNotice,
  ErrorState,
  Field,
  Input,
  LoadingBlock,
  Wordmark,
  cardClass,
  cn,
} from '@agrabudi/ui';
import { ChevronRight } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { appUrls } from '../app/env';
import { StageNotice } from '../app/StageNotice';
import { roleLabel, scopePhrase } from './access';
import type { AuthAdapter } from './adapter';
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
 * Halaman pertama Portal. Akun operasional masuk di sini; Administrator Web masuk
 * lewat console terpisah dan tidak ditawarkan di halaman ini (PRD 2.3).
 */
export function LoginPage() {
  const { session, signIn } = useSessionApi();
  const navigate = useNavigate();
  const location = useLocation();
  const [adapter, setAdapter] = useState<AuthAdapter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void getAuthAdapter().then((loaded) => {
      if (active) setAdapter(loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  if (session) return <Navigate to={targetAfterLogin(location.state)} replace />;

  async function run(action: (auth: AuthAdapter) => Promise<Parameters<typeof signIn>[0]>) {
    if (!adapter) return;
    setBusy(true);
    setError(null);
    try {
      signIn(await action(adapter));
      navigate(targetAfterLogin(location.state), { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Login gagal. Coba lagi beberapa saat.');
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void run((auth) =>
      auth.signIn({
        identifier: String(form.get('identifier') ?? ''),
        password: String(form.get('password') ?? ''),
      }),
    );
  }

  const demoAccounts = adapter?.demoAccounts ?? [];

  return (
    <>
      <AppSwitcher active="portal" urls={appUrls} />
      <StageNotice />
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10 tablet:py-16">
        <div>
          <Wordmark app="Portal" />
          <h1 className="mt-4 text-3xl font-extrabold">Masuk ke Portal</h1>
          <p className="mt-2 text-ink-700">Untuk karyawan dengan akun operasional.</p>
        </div>

        {error ? <ErrorState title="Belum bisa masuk" description={error} /> : null}

        {!adapter ? (
          <LoadingBlock label="Menyiapkan halaman masuk" rows={2} />
        ) : demoAccounts.length > 0 ? (
          <section aria-labelledby="akun-contoh" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="akun-contoh" className="text-base font-bold">
                Pilih akun contoh
              </h2>
              <DataNotice
                meta={{
                  source: 'mock',
                  asOf: new Date().toISOString(),
                  note: 'Akun contoh, bukan akun sungguhan.',
                }}
              />
            </div>
            <p className="text-sm text-ink-700">
              Tahap kerangka belum memakai kata sandi. Di versi sebenarnya halaman ini hanya berisi
              form masuk, tanpa pilihan jabatan.
            </p>
            <ul className={cn(cardClass, 'divide-y divide-surface-100 overflow-hidden')}>
              {demoAccounts.map((item) => (
                <li key={item.session.accountId}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void run((auth) => auth.signInAsDemo(item.session.accountId))}
                    className="flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface-50"
                  >
                    <span>
                      <span className="block font-semibold">{roleLabel(item.session)}</span>
                      <span className="block text-sm text-ink-700">
                        {item.summary} Cakupan: {scopePhrase(item.session)}.
                      </span>
                    </span>
                    <ChevronRight aria-hidden className="size-5 shrink-0 text-ink-500" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <Field label="Akun" htmlFor="login-akun">
              <Input id="login-akun" name="identifier" autoComplete="username" required />
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
        )}
      </main>
    </>
  );
}
