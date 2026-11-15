import { Button, EmptyState, Field, Input, buttonClass } from '@agrabudi/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { InactiveFormNote, SectionUnavailable } from '@/components/Notices';
import { PageIntro, pageBodyClass } from '@/components/PageIntro';
import { load } from '@/data';

export const metadata: Metadata = { title: 'Kirim lamaran' };

type ApplyPageProps = { params: Promise<{ slug: string }> };

export default async function ApplyPage({ params }: ApplyPageProps) {
  const { slug } = await params;
  const vacancy = await load((adapter) => adapter.getVacancy(slug));
  const back = (
    <Link href={`/karir/${slug}`} className="font-medium text-info underline">
      Detail lowongan
    </Link>
  );

  if (!vacancy.ok) {
    return (
      <>
        <PageIntro title="Kirim lamaran" back={back} />
        <div className={pageBodyClass}>
          <SectionUnavailable title="Lowongan tidak dapat dimuat" message={vacancy.message} />
        </div>
      </>
    );
  }
  if (!vacancy.data) notFound();
  const detail = vacancy.data;

  return (
    <>
      <PageIntro
        title={`Lamar: ${detail.title}`}
        description={`${detail.unit}, ${detail.location}`}
        back={back}
      />
      <div className={pageBodyClass}>
        {detail.status === 'closed' ? (
          <EmptyState
            title="Lowongan ini sudah ditutup"
            description="Lamaran baru tidak diterima untuk posisi ini."
            action={
              <Link href="/karir" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
                Lihat lowongan lain
              </Link>
            }
          />
        ) : (
          <form className="flex w-full max-w-xl flex-col gap-4" aria-describedby="catatan-lamaran">
            <Field label="Nama lengkap" htmlFor="lamar-nama">
              <Input id="lamar-nama" name="fullName" autoComplete="name" disabled />
            </Field>
            <Field label="Email" htmlFor="lamar-email">
              <Input id="lamar-email" name="email" type="email" autoComplete="email" disabled />
            </Field>
            <Field label="Nomor HP" htmlFor="lamar-hp">
              <Input
                id="lamar-hp"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                disabled
              />
            </Field>
            <Field
              label="CV"
              htmlFor="lamar-cv"
              hint="CV disimpan privat dan hanya dibuka petugas rekrutmen yang berizin."
            >
              <Input
                id="lamar-cv"
                name="cv"
                type="file"
                disabled
                className="py-2"
                aria-describedby="lamar-cv-hint"
              />
            </Field>
            <label className="flex min-h-11 items-start gap-3 text-sm">
              <input type="checkbox" name="consent" disabled className="mt-1 size-4" />
              <span>Saya setuju data lamaran ini diproses untuk keperluan rekrutmen.</span>
            </label>
            <Button type="submit" disabled>
              Kirim lamaran
            </Button>
            <InactiveFormNote id="catatan-lamaran">
              Pengiriman lamaran belum aktif. Jenis berkas, batas ukuran CV, dan teks persetujuan
              final ditentukan perusahaan.
            </InactiveFormNote>
          </form>
        )}
      </div>
    </>
  );
}
