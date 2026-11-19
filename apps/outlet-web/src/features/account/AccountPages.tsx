import {
  AsyncView,
  Button,
  DataNotice,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingBlock,
  PageHeader,
  StatusBadge,
  buttonClass,
  cardClass,
  cn,
  formatDate,
} from '@agrabudi/ui';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { getAuthAdapter } from '../../auth';
import { useOutletSession } from '../../auth/SessionContext';
import { useOutletProfile } from '../../data/queries';
import { ChangePasswordForm } from './PasswordPages';

/** Login mitra outlet dengan ID Digipos dan kata sandi. */
export function LoginPage() {
  const { session, signIn } = useOutletSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Kembali ke halaman yang meminta login. Hanya path internal yang diterima.
  const from: unknown = (location.state as { from?: unknown } | null)?.from;
  const target =
    typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : '/';

  const resetDone = (location.state as { notice?: unknown } | null)?.notice === 'password-reset';

  // Kata sandi sementara: ganti dulu, baru ke halaman tujuan.
  if (session) {
    return <Navigate to={session.mustChangePassword ? '/ganti-kata-sandi' : target} replace />;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const adapter = await getAuthAdapter();
      const next = await adapter.signIn({
        digiposId: String(form.get('digiposId') ?? ''),
        password: String(form.get('password') ?? ''),
      });
      signIn(next);
      navigate(next.mustChangePassword ? '/ganti-kata-sandi' : target, { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Login gagal. Coba lagi beberapa saat.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <PageHeader
        title="Masuk ke akun outlet"
        description="Khusus mitra outlet yang sudah terdaftar."
      />
      {resetDone && !error ? (
        <p role="status" className="flex flex-wrap items-center gap-2 text-sm">
          <StatusBadge tone="success">Kata sandi diganti</StatusBadge>
          Masuk dengan kata sandi baru Anda.
        </p>
      ) : null}
      {error ? <ErrorState title="Belum bisa masuk" description={error} /> : null}
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <Field label="ID Digipos" htmlFor="login-id">
          <Input id="login-id" name="digiposId" autoComplete="username" required />
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
      <Link to="/lupa-akses" className="text-sm font-medium text-info underline">
        Lupa kata sandi?
      </Link>
    </div>
  );
}

export function AccountPage() {
  const { session, status, signOut } = useOutletSession();
  if (!session && status === 'checking') return <LoadingBlock label="Memeriksa sesi" />;
  if (!session) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Akun" description="Profil outlet dan penanggung jawabnya." />
        <div className={cn(cardClass, 'flex flex-col items-start gap-3 p-6')}>
          <p className="font-semibold">Anda belum masuk</p>
          <p className="text-sm text-ink-700">
            Masuk dengan ID Digipos untuk melihat profil outlet.
          </p>
          <Link to="/login" className={buttonClass({ size: 'sm' })}>
            Masuk
          </Link>
        </div>
      </div>
    );
  }
  if (session.mustChangePassword) return <Navigate to="/ganti-kata-sandi" replace />;
  return <AccountProfile digiposId={session.digiposId} onSignOut={() => void signOut()} />;
}

const programStatus = {
  berjalan: { label: 'Berjalan', tone: 'info' },
  tercapai: { label: 'Tercapai', tone: 'success' },
  tidak_tercapai: { label: 'Tidak tercapai', tone: 'neutral' },
} as const;

function AccountProfile({ digiposId, onSignOut }: { digiposId: string; onSignOut: () => void }) {
  const profile = useOutletProfile(digiposId);
  const [passwordChanged, setPasswordChanged] = useState(false);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Akun"
        description="Profil outlet dan penanggung jawabnya."
        aside={profile.data ? <DataNotice meta={profile.data.meta} /> : null}
      />
      <AsyncView state={profile} errorTitle="Profil outlet tidak dapat dimuat">
        {(envelope) => {
          const detail = envelope.data;
          if (!detail) {
            return (
              <EmptyState
                title="Profil outlet tidak ditemukan"
                description="Hubungi salesforce Anda untuk memeriksa data outlet."
              />
            );
          }
          return (
            <div className="grid gap-6 desktop:grid-cols-[22rem_minmax(0,1fr)] desktop:items-start">
              <div className={cn(cardClass, 'overflow-hidden')}>
                {detail.photoUrl ? (
                  <img
                    src={detail.photoUrl}
                    alt={`Foto toko ${detail.outletName}`}
                    className="aspect-4/3 w-full object-cover"
                  />
                ) : null}
                <div className="p-5">
                  <p className="text-lg font-bold" data-testid="nama-outlet">
                    {detail.outletName}
                  </p>
                  <p className="text-sm text-ink-700">ID Digipos {detail.digiposId}</p>
                </div>
              </div>
              <div className="flex flex-col gap-6">
                <dl
                  className={cn(cardClass, 'grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 p-5 text-sm')}
                >
                  <dt className="text-ink-700">Pemilik</dt>
                  <dd className="font-medium">{detail.ownerName}</dd>
                  <dt className="text-ink-700">Nomor HP</dt>
                  <dd className="font-medium">{detail.phone}</dd>
                  <dt className="text-ink-700">Alamat</dt>
                  <dd className="font-medium">{detail.address}</dd>
                  <dt className="text-ink-700">TAP</dt>
                  <dd className="font-medium">{detail.tap ?? '-'}</dd>
                  <dt className="text-ink-700">Salesforce</dt>
                  <dd className="font-medium">{detail.salesforceName ?? '-'}</dd>
                  <dt className="text-ink-700">Terdaftar sejak</dt>
                  <dd className="font-medium">{formatDate(detail.registeredAt)}</dd>
                </dl>
                <section aria-labelledby="program-diikuti">
                  <h2 id="program-diikuti" className="text-lg font-bold">
                    Program yang diikuti
                  </h2>
                  {detail.programs.length === 0 ? (
                    <p className="mt-2 text-sm text-ink-700">Belum ikut program.</p>
                  ) : (
                    <ul className={cn(cardClass, 'mt-3 divide-y divide-surface-100')}>
                      {detail.programs.map((item) => (
                        <li
                          key={item.programTitle}
                          className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                        >
                          <span>
                            <span className="block font-semibold">{item.programTitle}</span>
                            <span className="block text-sm text-ink-700">{item.progress}</span>
                          </span>
                          <StatusBadge tone={programStatus[item.status].tone}>
                            {programStatus[item.status].label}
                          </StatusBadge>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
                <p className="text-sm text-ink-700">
                  Data outlet diubah lewat salesforce atau Admin. Hubungi mereka bila ada yang
                  salah.
                </p>
                <section
                  aria-labelledby="ganti-sandi"
                  className={cn(cardClass, 'flex flex-col gap-4 p-5')}
                >
                  <div>
                    <h2 id="ganti-sandi" className="text-lg font-bold">
                      Ganti kata sandi
                    </h2>
                    <p className="mt-1 text-sm text-ink-700">
                      Setelah diganti, sesi di perangkat lain otomatis keluar.
                    </p>
                  </div>
                  <ChangePasswordForm
                    currentLabel="Kata sandi saat ini"
                    submitLabel="Ganti kata sandi"
                    onDone={() => setPasswordChanged(true)}
                  />
                  {passwordChanged ? (
                    <p role="status" className="flex items-center gap-2 text-sm">
                      <StatusBadge tone="success">Kata sandi diganti</StatusBadge>
                    </p>
                  ) : null}
                </section>
                <div>
                  <Button variant="secondary" onClick={onSignOut}>
                    Keluar
                  </Button>
                </div>
              </div>
            </div>
          );
        }}
      </AsyncView>
    </div>
  );
}
