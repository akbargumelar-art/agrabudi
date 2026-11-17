import { EmptyState, Field, Input, buttonClass } from '@agrabudi/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicForm } from '@/components/PublicForm';
import { ConsentField, CvField, NameField, PhoneField } from '@/components/FormFields';
import { SectionUnavailable } from '@/components/Notices';
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
          <div className="w-full max-w-xl">
            <PublicForm
              endpoint={`job-application/${encodeURIComponent(slug)}`}
              withFile
              refPrefix="LMR"
              submitLabel="Kirim lamaran"
              successTitle="Lamaran terkirim"
              successText="Petugas rekrutmen akan menghubungi pelamar yang lolos seleksi berkas."
            >
              <NameField id="lamar-nama" label="Nama lengkap" />
              <Field label="Email" htmlFor="lamar-email">
                <Input id="lamar-email" name="email" type="email" autoComplete="email" required />
              </Field>
              <PhoneField id="lamar-hp" />
              <CvField id="lamar-cv" />
              <ConsentField text="Saya setuju data lamaran ini diproses untuk keperluan rekrutmen." />
            </PublicForm>
          </div>
        )}
      </div>
    </>
  );
}
