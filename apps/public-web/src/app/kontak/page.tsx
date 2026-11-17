import { DataNotice, Field, Select, Textarea } from '@agrabudi/ui';
import type { Metadata } from 'next';
import { ChannelList } from '@/components/company';
import { PublicForm } from '@/components/PublicForm';
import { NameField, PhoneField } from '@/components/FormFields';
import { SectionUnavailable } from '@/components/Notices';
import { PageIntro, pageBodyClass } from '@/components/PageIntro';
import { load } from '@/data';

export const metadata: Metadata = { title: 'Hubungi Kami' };

export default async function ContactPage() {
  const company = await load((adapter) => adapter.getCompanyProfile());
  return (
    <>
      <PageIntro
        title="Hubungi Kami"
        description="Kanal resmi untuk pertanyaan pelanggan, mitra, dan umum."
        aside={company.ok ? <DataNotice meta={company.meta} /> : null}
      />
      <div className={pageBodyClass}>
        <div className="grid gap-10 desktop:grid-cols-2">
          <section aria-labelledby="kanal-resmi">
            <h2 id="kanal-resmi" className="text-xl font-bold">
              Kanal resmi
            </h2>
            <div className="mt-4">
              {company.ok ? (
                <ChannelList channels={company.data.channels} />
              ) : (
                <SectionUnavailable
                  title="Kanal kontak tidak dapat dimuat"
                  message={company.message}
                />
              )}
            </div>
          </section>
          <section aria-labelledby="form-kontak">
            <h2 id="form-kontak" className="text-xl font-bold">
              Kirim pesan
            </h2>
            <div className="mt-4">
              <PublicForm
                endpoint="contact"
                refPrefix="PSN"
                submitLabel="Kirim pesan"
                successTitle="Pesan terkirim"
                successText="Tim kami membalas lewat nomor HP yang Anda isi pada jam kerja."
              >
                <NameField id="kontak-nama" />
                <PhoneField id="kontak-hp" />
                <Field label="Keperluan" htmlFor="kontak-topik">
                  <Select id="kontak-topik" name="topic" required defaultValue="">
                    <option value="" disabled>
                      Pilih keperluan
                    </option>
                    <option value="produk">Produk dan harga</option>
                    <option value="indihome">IndiHome</option>
                    <option value="mitra">Menjadi mitra outlet</option>
                    <option value="lainnya">Lainnya</option>
                  </Select>
                </Field>
                <Field label="Pesan" htmlFor="kontak-pesan">
                  <Textarea
                    id="kontak-pesan"
                    name="message"
                    required
                    minLength={10}
                    maxLength={1000}
                  />
                </Field>
              </PublicForm>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
