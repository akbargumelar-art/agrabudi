import { DataNotice, StatusBadge, buttonClass, formatDate } from '@agrabudi/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SectionUnavailable } from '@/components/Notices';
import { PageIntro, pageBodyClass } from '@/components/PageIntro';
import { load } from '@/data';

export const metadata: Metadata = { title: 'Detail lowongan' };

type VacancyPageProps = { params: Promise<{ slug: string }> };

const back = (
  <Link href="/karir" className="font-medium text-info underline">
    Semua lowongan
  </Link>
);

export default async function VacancyPage({ params }: VacancyPageProps) {
  const { slug } = await params;
  const vacancy = await load((adapter) => adapter.getVacancy(slug));

  if (!vacancy.ok) {
    return (
      <>
        <PageIntro title="Detail lowongan" back={back} />
        <div className={pageBodyClass}>
          <SectionUnavailable title="Lowongan tidak dapat dimuat" message={vacancy.message} />
        </div>
      </>
    );
  }
  if (!vacancy.data) notFound();
  const detail = vacancy.data;
  const open = detail.status === 'open';

  return (
    <>
      <PageIntro
        title={detail.title}
        description={`${detail.unit}, ${detail.location}`}
        back={back}
        aside={<DataNotice meta={vacancy.meta} />}
      />
      <div className={pageBodyClass}>
        <div className="grid gap-10 desktop:grid-cols-[minmax(0,1fr)_22rem] desktop:items-start">
          <div className="flex flex-col gap-8">
            <p className="max-w-prose">{detail.summary}</p>
            <section aria-labelledby="persyaratan">
              <h2 id="persyaratan" className="text-xl font-bold">
                Persyaratan
              </h2>
              <ul className="mt-3 list-disc space-y-1 pl-5">
                {detail.requirements.map((requirement) => (
                  <li key={requirement}>{requirement}</li>
                ))}
              </ul>
            </section>
          </div>
          <aside
            aria-label="Status lowongan"
            className="flex flex-col items-start gap-3 rounded-panel border border-surface-100 p-5"
          >
            {open ? (
              <>
                <StatusBadge tone="success">Dibuka</StatusBadge>
                <p className="text-sm text-ink-700">
                  Lamaran diterima sampai {formatDate(detail.closesAt)}.
                </p>
                <Link href={`/karir/${detail.slug}/lamar`} className={buttonClass({ block: true })}>
                  Lamar posisi ini
                </Link>
              </>
            ) : (
              <>
                <StatusBadge tone="neutral">Ditutup</StatusBadge>
                <p className="text-sm text-ink-700">
                  Lowongan ini ditutup pada {formatDate(detail.closesAt)} dan tidak menerima lamaran
                  baru.
                </p>
                <Link href="/karir" className={buttonClass({ variant: 'secondary', block: true })}>
                  Lihat lowongan lain
                </Link>
              </>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
