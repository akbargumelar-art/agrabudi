import { staffProfileUpdateSchema } from '@agrabudi/contracts';
import {
  Button,
  ErrorState,
  Field,
  Input,
  PageHeader,
  cardClass,
  cn,
  useToast,
} from '@agrabudi/ui';
import { useState, type FormEvent } from 'react';
import { getAuthAdapter } from '../../auth';
import { roleLabel, scopeLabel } from '../../auth/access';
import { useSession, useSessionApi } from '../../auth/SessionContext';

type FieldErrors = Partial<Record<'displayName' | 'email' | 'phone', string>>;

/**
 * Profil akun. Nama, email, dan nomor HP bisa diubah pemilik akun. Username, peran,
 * dan cakupan data hanya bisa diubah pengelola akses, jadi tampil tanpa kolom isian.
 */
export function AccountPage() {
  const session = useSession();
  const { signIn, signOut } = useSessionApi();
  const toast = useToast();
  const [displayName, setDisplayName] = useState(session.displayName);
  const [email, setEmail] = useState(session.email ?? '');
  const [phone, setPhone] = useState(session.phone ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const changed =
    displayName.trim() !== session.displayName ||
    email.trim() !== (session.email ?? '') ||
    phone.trim() !== (session.phone ?? '');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = staffProfileUpdateSchema.safeParse({
      displayName,
      email: email.trim() === '' ? null : email.trim(),
      phone: phone.trim() === '' ? null : phone.trim(),
    });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if ((key === 'displayName' || key === 'email' || key === 'phone') && !next[key])
          next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setFailure(null);
    setBusy(true);
    try {
      const adapter = await getAuthAdapter();
      const updated = await adapter.updateProfile(session, parsed.data);
      signIn(updated);
      toast.show({ tone: 'success', message: 'Profil disimpan.' });
    } catch (cause) {
      setFailure(
        cause instanceof Error ? cause.message : 'Profil belum tersimpan. Coba lagi beberapa saat.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Akun" description="Profil dan hak akses akun yang sedang dipakai." />

      <div className="grid gap-6 desktop:grid-cols-[minmax(0,1fr)_20rem] desktop:items-start">
        <form
          className={cn(cardClass, 'flex flex-col gap-4 p-5 tablet:p-6')}
          onSubmit={onSubmit}
          noValidate
        >
          <h2 className="text-lg font-bold">Profil</h2>
          <Field label="Username" htmlFor="profil-username" hint="Username tidak bisa diubah.">
            <Input
              id="profil-username"
              value={session.username}
              readOnly
              disabled
              aria-describedby="profil-username-hint"
            />
          </Field>
          <Field label="Nama lengkap" htmlFor="profil-nama" error={errors.displayName}>
            <Input
              id="profil-nama"
              name="displayName"
              autoComplete="name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              aria-invalid={Boolean(errors.displayName)}
            />
          </Field>
          <Field label="Email" htmlFor="profil-email" error={errors.email}>
            <Input
              id="profil-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(errors.email)}
            />
          </Field>
          <Field label="Nomor HP" htmlFor="profil-hp" error={errors.phone}>
            <Input
              id="profil-hp"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              aria-invalid={Boolean(errors.phone)}
            />
          </Field>
          {failure ? <ErrorState title="Profil belum tersimpan" description={failure} /> : null}
          <div>
            <Button type="submit" disabled={busy || !changed}>
              Simpan perubahan
            </Button>
          </div>
        </form>

        <div className="flex flex-col gap-4">
          <dl className={cn(cardClass, 'grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 p-5 text-sm')}>
            <dt className="text-ink-700">Peran</dt>
            <dd data-testid="profil-peran" className="font-medium">
              {roleLabel(session)}
            </dd>
            <dt className="text-ink-700">Cakupan data</dt>
            <dd className="font-medium">{scopeLabel(session)}</dd>
            <dt className="text-ink-700">Izin tambahan</dt>
            <dd className="font-medium">
              {session.permissions.length > 0 ? session.permissions.join(', ') : 'Tidak ada'}
            </dd>
          </dl>
          <p className="text-sm text-ink-700">Peran dan cakupan data diatur pengelola akses.</p>
          <div>
            <Button variant="secondary" onClick={signOut}>
              Keluar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
