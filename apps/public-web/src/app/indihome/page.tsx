import { Button, DataNotice, EmptyState, Field, Input, Textarea, formatRupiah } from '@agrabudi/ui';
import type { Metadata } from 'next';
import { InactiveFormNote, PendingContent, SectionUnavailable } from '@/components/Notices';
import { PageIntro, pageBodyClass } from '@/components/PageIntro';
import { load } from '@/data';

export const metadata: Metadata = { title: 'IndiHome' };

export default async function IndihomePage() {
  const packages = await load((adapter) => adapter.listIndihomePackages());
  return (
    <>
      <PageIntro
        title="IndiHome"
        description="Paket internet rumah, syarat pemasangan, dan pendaftaran minat."
        aside={packages.ok ? <DataNotice meta={packages.meta} /> : null}
      />
      <div className={pageBodyClass}>
        <section aria-labelledby="paket-indihome">
          <h2 id="paket-indihome" className="text-xl font-bold">
            Paket dan layanan
          </h2>
          <div className="mt-4">
            {!packages.ok ? (
              <SectionUnavailable
                title="Paket IndiHome tidak dapat dimuat"
                message={packages.message}
              />
            ) : packages.data.length === 0 ? (
              <EmptyState
                title="Belum ada paket terbit"
                description="Paket tampil setelah diterbitkan Admin unit IndiHome."
              />
            ) : (
              <ul className="divide-y divide-surface-100 border-y border-surface-100">
                {packages.data.map((item) => (
                  <li
                    key={item.id}
                    className="grid gap-1 py-5 tablet:grid-cols-[minmax(0,1fr)_auto] tablet:gap-8"
                  >
                    <div>
                      <h3 className="text-lg font-bold">{item.name}</h3>
                      <p className="mt-1 max-w-prose text-sm text-ink-700">{item.summary}</p>
                    </div>
                    <p className="tablet:text-right">
                      {item.monthlyPriceRupiah === null ? (
                        <span className="text-sm text-ink-700">Harga belum diterbitkan</span>
                      ) : (
                        <>
                          <span className="font-display text-lg font-bold text-brand-red-strong">
                            {formatRupiah(item.monthlyPriceRupiah)}
                          </span>
                          <span className="text-sm text-ink-700"> per bulan</span>
                        </>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <div className="grid gap-10 desktop:grid-cols-2">
          <div className="flex flex-col gap-10">
            <section aria-labelledby="syarat-indihome">
              <h2 id="syarat-indihome" className="text-xl font-bold">
                Syarat pemasangan
              </h2>
              <div className="mt-4">
                <PendingContent what="Syarat pemasangan" owner="Admin unit IndiHome" />
              </div>
            </section>
            <section aria-labelledby="faq-indihome">
              <h2 id="faq-indihome" className="text-xl font-bold">
                Pertanyaan yang sering diajukan
              </h2>
              <div className="mt-4">
                <PendingContent what="Daftar pertanyaan dan jawaban" owner="Admin unit IndiHome" />
              </div>
            </section>
          </div>

          <section aria-labelledby="minat-indihome">
            <h2 id="minat-indihome" className="text-xl font-bold">
              Daftar minat pemasangan
            </h2>
            <p className="mt-2 max-w-prose text-sm text-ink-700">
              Mengirim form ini berarti meminta dihubungi petugas. Ketersediaan jaringan dan jadwal
              pemasangan dikonfirmasi petugas, tidak otomatis.
            </p>
            <form className="mt-4 flex flex-col gap-4" aria-describedby="catatan-minat">
              <Field label="Nama" htmlFor="minat-nama">
                <Input id="minat-nama" name="name" autoComplete="name" disabled />
              </Field>
              <Field label="Nomor HP" htmlFor="minat-hp">
                <Input
                  id="minat-hp"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  disabled
                />
              </Field>
              <Field label="Alamat pemasangan" htmlFor="minat-alamat">
                <Textarea id="minat-alamat" name="address" autoComplete="street-address" disabled />
              </Field>
              <Button type="submit" disabled>
                Kirim minat pemasangan
              </Button>
              <InactiveFormNote id="catatan-minat">
                Pendaftaran minat belum aktif. Form ini menyala setelah layanan pendaftaran
                tersedia.
              </InactiveFormNote>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
