import {
  DataNotice,
  Field,
  IconBadge,
  Input,
  cardClass,
  cn,
  type IconComponent,
} from '@agrabudi/ui';
import { Gamepad2, Receipt, Smartphone, Wallet, Wifi } from 'lucide-react';
import type { Metadata } from 'next';
import { PublicForm } from '@/components/PublicForm';
import { AddressField, NameField, PhoneField } from '@/components/FormFields';
import { SectionUnavailable } from '@/components/Notices';
import { PageIntro, pageBodyClass } from '@/components/PageIntro';
import { load } from '@/data';
import googlePlayBadge from './google-play-badge.png';

export const metadata: Metadata = { title: 'Daftar Digipos' };

/** Halaman resmi aplikasi di Google Play (penerbit: Telkomsel). */
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.telkomsel.digiposaja';

/** Jenis transaksi sesuai halaman resmi telkomsel.com/DigiPOSAJA. */
const transactions: Array<{ icon: IconComponent; label: string }> = [
  { icon: Smartphone, label: 'Pulsa' },
  { icon: Gamepad2, label: 'Paket internet, game, video' },
  { icon: Receipt, label: 'PPOB: token listrik, tagihan IndiHome, dll.' },
  { icon: Wallet, label: 'Isi saldo e-wallet' },
  { icon: Wifi, label: 'Layanan IndiHome' },
];

function PlayStoreLink() {
  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <img
        src={googlePlayBadge.src}
        width={googlePlayBadge.width}
        height={googlePlayBadge.height}
        alt="Download DigiPOS Aja! di Google Play"
        className="h-14 w-auto"
      />
    </a>
  );
}

export default async function DigiposPage() {
  const info = await load((adapter) => adapter.getDigiposInfo());
  return (
    <>
      <PageIntro
        title="Daftar Digipos"
        description="Jual pulsa, paket, dan transaksi digital Telkomsel dari HP lewat aplikasi DigiPOS Aja!"
        aside={info.ok ? <DataNotice meta={info.meta} /> : null}
      />
      <div className={pageBodyClass}>
        <section
          aria-labelledby="aplikasi-digipos"
          className="grid gap-6 desktop:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] desktop:items-center"
        >
          <div className="max-w-prose">
            <h2 id="aplikasi-digipos" className="text-2xl font-extrabold">
              Kenalan dengan DigiPOS Aja!
            </h2>
            <p className="mt-3">
              DigiPOS Aja! adalah aplikasi Telkomsel untuk outlet dan perorangan yang ingin menjual
              produk Telkomsel serta transaksi digital lainnya. Pendaftaran agen dilakukan langsung
              di aplikasi dengan menyiapkan KTP.
            </p>
            <p className="mt-3 text-sm text-ink-700">
              Belum punya aplikasinya? Unduh dulu, lalu pilih “Daftar Sebagai Agen”.
            </p>
            <div className="mt-5">
              <PlayStoreLink />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold">Yang bisa dijual</h3>
            <ul className={cn(cardClass, 'mt-3 divide-y divide-surface-100')}>
              {transactions.map((item) => (
                <li key={item.label} className="flex items-center gap-4 p-4">
                  <IconBadge icon={item.icon} />
                  <span className="font-semibold">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

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
              Form calon mitra
            </h2>
            <p className="mt-2 max-w-prose text-sm text-ink-700">
              Isi data outlet Anda. Tim Agrabudi Komunika menghubungi lewat nomor HP ini untuk
              membantu pendaftaran dan aktivasi.
            </p>
            <div className="mt-4">
              <PublicForm
                endpoint="digipos-registration"
                refPrefix="DGP"
                submitLabel="Kirim data calon mitra"
                successTitle="Data terkirim"
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
              </PublicForm>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
