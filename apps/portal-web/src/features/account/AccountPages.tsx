import { Button, EmptyState, Field, Input, PageHeader, buttonClass } from '@agrabudi/ui';
import { Link } from 'react-router';

/**
 * Login Portal untuk akun operasional. Tidak ada pilihan jabatan, dan
 * Administrator Web tidak masuk dari sini (PRD 2.2, 2.3).
 */
export function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <PageHeader title="Masuk ke Portal" description="Untuk karyawan dengan akun operasional." />
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => event.preventDefault()}
        aria-describedby="catatan-login"
      >
        <Field label="Akun" htmlFor="login-akun">
          <Input id="login-akun" name="identifier" autoComplete="username" disabled />
        </Field>
        <Field label="Kata sandi" htmlFor="login-sandi">
          <Input
            id="login-sandi"
            name="password"
            type="password"
            autoComplete="current-password"
            disabled
          />
        </Field>
        <Button type="submit" block disabled>
          Masuk
        </Button>
        <p id="catatan-login" className="text-sm font-medium text-ink-900">
          Login Portal belum aktif. Form ini menyala setelah layanan akun tersedia.
        </p>
      </form>
    </div>
  );
}

export function AccountPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Akun" description="Profil, unit, wilayah, dan izin akun Anda." />
      <EmptyState
        title="Anda belum masuk"
        description="Profil dan izin tampil setelah Anda masuk. Layanan akun Portal belum aktif pada tahap kerangka ini."
        action={
          <Link to="/login" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
            Buka halaman masuk
          </Link>
        }
      />
    </div>
  );
}
