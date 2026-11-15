import { Button, EmptyState, Field, Input, PageHeader, buttonClass } from '@agrabudi/ui';
import { Link } from 'react-router';

const AUTH_NOTE = 'Login outlet belum aktif. Form ini menyala setelah layanan akun tersedia.';

export function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <PageHeader
        title="Masuk ke akun outlet"
        description="Khusus outlet yang sudah terverifikasi."
      />
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => event.preventDefault()}
        aria-describedby="catatan-login"
      >
        <Field label="ID outlet atau nomor terdaftar" htmlFor="login-id">
          <Input id="login-id" name="identifier" autoComplete="username" disabled />
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
          {AUTH_NOTE}
        </p>
      </form>
      <Link to="/lupa-akses" className="text-sm font-medium text-info underline">
        Lupa akses akun?
      </Link>
    </div>
  );
}

export function RecoverAccessPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <PageHeader
        title="Pulihkan akses akun"
        description="Masukkan ID outlet atau nomor terdaftar. Petunjuk pemulihan dikirim ke kontak yang tercatat."
      />
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => event.preventDefault()}
        aria-describedby="catatan-pulih"
      >
        <Field label="ID outlet atau nomor terdaftar" htmlFor="pulih-id">
          <Input id="pulih-id" name="identifier" autoComplete="username" disabled />
        </Field>
        <Button type="submit" block disabled>
          Kirim petunjuk pemulihan
        </Button>
        <p id="catatan-pulih" className="text-sm font-medium text-ink-900">
          Pemulihan akses belum aktif. Kanal pengiriman petunjuk belum ditentukan.
        </p>
      </form>
      <Link to="/login" className="text-sm font-medium text-info underline">
        Kembali ke halaman masuk
      </Link>
    </div>
  );
}

export function AccountPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Akun"
        description="Profil outlet, penanggung jawab, dan keterkaitan outlet."
      />
      <EmptyState
        title="Anda belum masuk"
        description="Profil outlet tampil setelah Anda masuk. Layanan akun outlet belum aktif pada tahap kerangka ini."
        action={
          <Link to="/login" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
            Buka halaman masuk
          </Link>
        }
      />
    </div>
  );
}
