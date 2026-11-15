import { Button, Field, Input, PageHeader, StatusBadge } from '@agrabudi/ui';

export function CalculatorPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Kalkulator Cuan"
        description="Simulasi keuntungan dari penjualan paket."
        aside={<StatusBadge tone="warning">Rumus belum disahkan</StatusBadge>}
      />
      <div className="grid gap-6 desktop:grid-cols-2">
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => event.preventDefault()}
          aria-describedby="catatan-kalkulator"
        >
          <Field label="Paket" htmlFor="kalkulator-paket">
            <Input id="kalkulator-paket" disabled placeholder="Pilih paket" />
          </Field>
          <Field label="Jumlah terjual" htmlFor="kalkulator-jumlah">
            <Input id="kalkulator-jumlah" inputMode="numeric" disabled placeholder="0" />
          </Field>
          <Button type="submit" disabled>
            Hitung simulasi
          </Button>
        </form>
        <div
          id="catatan-kalkulator"
          className="rounded-panel border border-dashed border-ink-300 bg-surface-50 p-6"
        >
          <h2 className="text-base font-bold">Kenapa belum bisa dipakai</h2>
          <p className="mt-2 max-w-prose text-sm text-ink-700">
            Kalkulator hanya boleh menghitung dengan rumus yang sudah disahkan perusahaan, lengkap
            dengan contoh input dan hasil. Rumus itu belum tersedia, jadi halaman ini tidak
            menampilkan angka apa pun.
          </p>
        </div>
      </div>
    </div>
  );
}
