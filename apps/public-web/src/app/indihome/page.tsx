import { DataNotice, EmptyState, cardClass, cn, formatRupiah } from '@agrabudi/ui';
import { Check } from 'lucide-react';
import type { Metadata } from 'next';
import { DemoForm } from '@/components/DemoForm';
import { AddressField, NameField, PhoneField } from '@/components/FormFields';
import { SectionUnavailable } from '@/components/Notices';
import { PageIntro, pageBodyClass } from '@/components/PageIntro';
import { load } from '@/data';

export const metadata: Metadata = { title: 'IndiHome' };

export default async function IndihomePage() {
  const [packages, info] = await Promise.all([
    load((adapter) => adapter.listIndihomePackages()),
    load((adapter) => adapter.getIndihomeInfo()),
  ]);
  return (
    <>
      <PageIntro
        title="IndiHome"
        description="Paket internet rumah, syarat pemasangan, dan pendaftaran minat."
        aside={packages.ok ? <DataNotice meta={packages.meta} /> : null}
      />
      <div className={pageBodyClass}>
        <section aria-labelledby="paket-indihome">
          <h2 id="paket-indihome" className="text-2xl font-extrabold">
            Paket dan layanan
          </h2>
          <div className="mt-5">
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
              <ul className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
                {packages.data.map((item) => (
                  <li key={item.id} className={cn(cardClass, 'flex flex-col overflow-hidden')}>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={`Gambar ${item.name}`}
                        loading="lazy"
                        className="aspect-4/3 w-full object-cover"
                      />
                    ) : null}
                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <h3 className="text-lg font-bold">{item.name}</h3>
                      <p className="text-sm text-ink-700">{item.summary}</p>
                      <ul className="flex flex-col gap-1 text-sm">
                        {item.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2">
                            <Check aria-hidden className="size-4 text-success" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-auto pt-2">
                        {item.monthlyPriceRupiah === null ? (
                          <span className="text-sm text-ink-700">Harga belum diterbitkan</span>
                        ) : (
                          <>
                            <span className="font-display text-xl font-bold text-brand-red-strong">
                              {formatRupiah(item.monthlyPriceRupiah)}
                            </span>
                            <span className="text-sm text-ink-700"> per bulan</span>
                          </>
                        )}
                      </p>
                    </div>
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
              {info.ok ? (
                <ul className="mt-4 list-disc space-y-1.5 pl-5">
                  {info.data.requirements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <div className="mt-4">
                  <SectionUnavailable title="Syarat tidak dapat dimuat" message={info.message} />
                </div>
              )}
            </section>
            <section aria-labelledby="faq-indihome">
              <h2 id="faq-indihome" className="text-xl font-bold">
                Pertanyaan yang sering diajukan
              </h2>
              {info.ok ? (
                <div className={cn(cardClass, 'mt-4 divide-y divide-surface-100')}>
                  {info.data.faqs.map((faq) => (
                    <details key={faq.question} className="group px-5">
                      <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-3 font-semibold">
                        {faq.question}
                        <span aria-hidden className="text-ink-500 group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <p className="pb-4 text-sm text-ink-700">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              ) : null}
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
            <div className="mt-4">
              <DemoForm
                refPrefix="MNT"
                submitLabel="Kirim minat pemasangan"
                successTitle="Minat pemasangan terkirim"
                successText="Petugas akan menghubungi Anda untuk mengecek jaringan dan jadwal survei."
              >
                <NameField id="minat-nama" />
                <PhoneField id="minat-hp" />
                <AddressField id="minat-alamat" label="Alamat pemasangan" />
              </DemoForm>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
