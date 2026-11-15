import { Button, Field, Input, Textarea } from '@agrabudi/ui';
import type { Metadata } from 'next';
import { InactiveFormNote, PendingContent } from '@/components/Notices';
import { PageIntro, pageBodyClass } from '@/components/PageIntro';

export const metadata: Metadata = { title: 'Daftar Digipos' };

export default function DigiposPage() {
  return (
    <>
      <PageIntro title="Daftar Digipos" description="Pendaftaran outlet sebagai mitra Digipos." />
      <div className={pageBodyClass}>
        <div className="grid gap-10 desktop:grid-cols-2">
          <section aria-labelledby="syarat-digipos">
            <h2 id="syarat-digipos" className="text-xl font-bold">
              Syarat pendaftaran
            </h2>
            <div className="mt-4">
              <PendingContent
                what="Syarat dan informasi pendaftaran"
                owner="Admin layanan Digipos"
              />
            </div>
            <p className="mt-4 max-w-prose text-sm text-ink-700">
              Setelah form dikirim, Anda mendapat nomor referensi untuk memantau status. Pendaftaran
              diverifikasi petugas; akun Digipos tidak aktif otomatis.
            </p>
          </section>
          <section aria-labelledby="form-digipos">
            <h2 id="form-digipos" className="text-xl font-bold">
              Form pendaftaran
            </h2>
            <form className="mt-4 flex flex-col gap-4" aria-describedby="catatan-digipos">
              <Field label="Nama outlet" htmlFor="digipos-outlet">
                <Input id="digipos-outlet" name="outletName" autoComplete="organization" disabled />
              </Field>
              <Field label="Nama pemilik" htmlFor="digipos-pemilik">
                <Input id="digipos-pemilik" name="ownerName" autoComplete="name" disabled />
              </Field>
              <Field label="Nomor HP" htmlFor="digipos-hp">
                <Input
                  id="digipos-hp"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  disabled
                />
              </Field>
              <Field label="Alamat outlet" htmlFor="digipos-alamat">
                <Textarea
                  id="digipos-alamat"
                  name="address"
                  autoComplete="street-address"
                  disabled
                />
              </Field>
              <Button type="submit" disabled>
                Kirim pendaftaran
              </Button>
              <InactiveFormNote id="catatan-digipos">
                Pendaftaran belum aktif. Kolom form final ditentukan Admin layanan Digipos.
              </InactiveFormNote>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
