import { Button, Field, Input, Textarea } from '@agrabudi/ui';
import type { Metadata } from 'next';
import { InactiveFormNote, PendingContent } from '@/components/Notices';
import { PageIntro, pageBodyClass } from '@/components/PageIntro';

export const metadata: Metadata = { title: 'Hubungi Kami' };

export default function ContactPage() {
  return (
    <>
      <PageIntro
        title="Hubungi Kami"
        description="Kanal resmi untuk pertanyaan pelanggan, mitra, dan umum."
      />
      <div className={pageBodyClass}>
        <div className="grid gap-10 desktop:grid-cols-2">
          <section aria-labelledby="kanal-resmi">
            <h2 id="kanal-resmi" className="text-xl font-bold">
              Kanal resmi
            </h2>
            <div className="mt-4">
              <PendingContent what="Nomor telepon, WhatsApp, email, dan jam layanan" />
            </div>
          </section>
          <section aria-labelledby="form-kontak">
            <h2 id="form-kontak" className="text-xl font-bold">
              Kirim pesan
            </h2>
            <form className="mt-4 flex flex-col gap-4" aria-describedby="catatan-kontak">
              <Field label="Nama" htmlFor="kontak-nama">
                <Input id="kontak-nama" name="name" autoComplete="name" disabled />
              </Field>
              <Field label="Nomor HP" htmlFor="kontak-hp">
                <Input
                  id="kontak-hp"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  disabled
                />
              </Field>
              <Field label="Pesan" htmlFor="kontak-pesan">
                <Textarea id="kontak-pesan" name="message" disabled />
              </Field>
              <Button type="submit" disabled>
                Kirim pesan
              </Button>
              <InactiveFormNote id="catatan-kontak">
                Pengiriman pesan belum aktif. Form ini menyala setelah layanan penerima pesan
                tersedia.
              </InactiveFormNote>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
