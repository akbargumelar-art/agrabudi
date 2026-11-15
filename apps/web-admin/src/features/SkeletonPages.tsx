import { Button, EmptyState, Field, Input, PageHeader, Select } from '@agrabudi/ui';

export function NavigationPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Navigasi"
        description="Susunan menu yang diizinkan dan tautan antar aplikasi."
      />
      <EmptyState
        title="Pengaturan navigasi belum aktif"
        description="Di sini Anda nanti mengatur urutan menu dan footer dari daftar tautan yang diizinkan. Menu milik modul bisnis tidak bisa dihapus dari sini."
      />
    </div>
  );
}

export function LayoutsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Layout"
        description="Urutan bagian halaman dan komponen tampilan yang sudah disediakan."
      />
      <EmptyState
        title="Pengaturan layout belum aktif"
        description="Di sini Anda nanti menyusun bagian halaman dari komponen yang tersedia. Tidak ada editor kode atau HTML bebas."
      />
    </div>
  );
}

export function AssetsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Aset Website"
        description="Logo resmi, foto kantor, gambar korporat, dan aset banner."
      />
      <EmptyState
        title="Belum ada aset"
        description="Unggah aset belum aktif. Logo dan foto resmi dari perusahaan dimasukkan setelah penyimpanan berkas tersedia."
      />
    </div>
  );
}

export function PreviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Preview"
        description="Lihat draft di website dan ukuran layar yang dipilih sebelum diterbitkan."
      />
      <form
        className="grid gap-4 tablet:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] tablet:items-end"
        onSubmit={(event) => event.preventDefault()}
        aria-describedby="catatan-preview"
      >
        <Field label="Website" htmlFor="preview-situs">
          <Select id="preview-situs" disabled defaultValue="public">
            <option value="public">Publik</option>
            <option value="outlet">Outlet</option>
            <option value="portal">Portal</option>
          </Select>
        </Field>
        <Field label="Ukuran layar" htmlFor="preview-layar">
          <Select id="preview-layar" disabled defaultValue="360">
            <option value="360">Smartphone, 360 px</option>
            <option value="768">Tablet, 768 px</option>
            <option value="1440">Desktop, 1440 px</option>
          </Select>
        </Field>
        <Button type="submit" disabled>
          Buka preview
        </Button>
      </form>
      <p id="catatan-preview" className="text-sm font-medium text-ink-900">
        Preview belum aktif. Preview draft memakai sesi berizin dan tidak masuk cache publik.
      </p>
    </div>
  );
}

export function AuditPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit Konten"
        description="Catatan perubahan konten website: siapa, apa, dan kapan."
      />
      <EmptyState
        title="Belum ada catatan audit"
        description="Catatan muncul setelah ada perubahan konten melalui console ini. Audit di sini hanya mencakup konten website, bukan data operasional."
      />
    </div>
  );
}

/**
 * Login khusus Administrator Web (PRD 2.3). Akun ini terpisah dari akun Portal
 * dan Outlet; akun Admin, Manager, atau GM tidak otomatis bisa masuk.
 */
export function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div>
        <p className="font-display text-sm font-semibold text-console">Console Administrator Web</p>
        <h1 className="mt-1 text-2xl font-bold">Masuk</h1>
        <p className="mt-2 text-sm text-ink-700">
          Hanya untuk akun Administrator Web. Akun Portal dan Outlet tidak bisa dipakai di sini.
        </p>
      </div>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => event.preventDefault()}
        aria-describedby="catatan-login"
      >
        <Field label="Akun Administrator Web" htmlFor="login-akun">
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
          Login console belum aktif. Form ini menyala setelah layanan akun Administrator Web
          tersedia.
        </p>
      </form>
    </main>
  );
}
