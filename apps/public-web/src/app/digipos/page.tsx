import { DataNotice, Field, Input } from '@agrabudi/ui';
import type { Metadata } from 'next';
import { DemoForm } from '@/components/DemoForm';
import { AddressField, NameField, PhoneField } from '@/components/FormFields';
import { SectionUnavailable } from '@/components/Notices';
import { PageIntro, pageBodyClass } from '@/components/PageIntro';
import { load } from '@/data';

export const metadata: Metadata = { title: 'Daftar Digipos' };

export default async function DigiposPage() {
  const info = await load((adapter) => adapter.getDigiposInfo());
  return (
    <>
      <PageIntro
        title="Daftar Digipos"
        description="Pendaftaran outlet sebagai mitra Digipos."
        aside={info.ok ? <DataNotice meta={info.meta} /> : null}
      />
      <div className={pageBodyClass}>
        <div className="grid gap-10 desktop:grid-cols-2">
          <div className="flex flex-col gap-10">
            {info.ok ? (
              <>
                <section aria-labelledby="syarat-digipos">
                  <h2 id="syarat-digipos" className="text-xl font-bold">
                    Syarat pendaftaran
                  </h2>
                  <ul className="mt-4 list-disc space-y-1.5 pl-5">
                    {info.data.requirements.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
                <section aria-labelledby="langkah-digipos">
                  <h2 id="langkah-digipos" className="text-xl font-bold">
                    Langkah pendaftaran
                  </h2>
                  <ol className="mt-4 flex flex-col gap-3">
                    {info.data.steps.map((step, index) => (
                      <li key={step} className="flex items-start gap-3">
                        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-red-soft text-sm font-bold text-brand-red-strong">
                          {index + 1}
                        </span>
                        <span className="pt-1">{step}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              </>
            ) : (
              <SectionUnavailable
                title="Informasi Digipos tidak dapat dimuat"
                message={info.message}
              />
            )}
          </div>
          <section aria-labelledby="form-digipos">
            <h2 id="form-digipos" className="text-xl font-bold">
              Form pendaftaran
            </h2>
            <div className="mt-4">
              <DemoForm
                refPrefix="DGP"
                submitLabel="Kirim pendaftaran"
                successTitle="Pendaftaran terkirim"
                successText="Simpan nomor referensi ini. Petugas akan menghubungi Anda untuk verifikasi."
              >
                <Field label="Nama outlet" htmlFor="digipos-outlet">
                  <Input
                    id="digipos-outlet"
                    name="outletName"
                    autoComplete="organization"
                    required
                    maxLength={80}
                  />
                </Field>
                <NameField id="digipos-pemilik" label="Nama pemilik" />
                <PhoneField id="digipos-hp" />
                <AddressField id="digipos-alamat" label="Alamat outlet" />
              </DemoForm>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
