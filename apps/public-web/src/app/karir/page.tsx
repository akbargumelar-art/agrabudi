import { DataNotice, EmptyState, StatusBadge, formatDate } from '@agrabudi/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionUnavailable } from '@/components/Notices';
import { PageIntro, pageBodyClass } from '@/components/PageIntro';
import { load } from '@/data';

export const metadata: Metadata = { title: 'Karir' };

export default async function CareersPage() {
  const vacancies = await load((adapter) => adapter.listVacancies());
  return (
    <>
      <PageIntro
        title="Karir"
        description="Lowongan di PT Agrabudi Komunika."
        aside={vacancies.ok ? <DataNotice meta={vacancies.meta} /> : null}
      />
      <div className={pageBodyClass}>
        {!vacancies.ok ? (
          <SectionUnavailable title="Lowongan tidak dapat dimuat" message={vacancies.message} />
        ) : vacancies.data.length === 0 ? (
          <EmptyState
            title="Belum ada lowongan"
            description="Lowongan baru tampil di sini saat dibuka."
          />
        ) : (
          <ul className="divide-y divide-surface-100 border-y border-surface-100">
            {vacancies.data.map((vacancy) => (
              <li key={vacancy.id}>
                <Link
                  href={`/karir/${vacancy.slug}`}
                  className="grid gap-2 py-5 hover:bg-surface-50 tablet:grid-cols-[minmax(0,1fr)_auto] tablet:items-center tablet:gap-8"
                >
                  <span>
                    <span className="block text-xl font-bold">{vacancy.title}</span>
                    <span className="block text-sm text-ink-700">
                      {vacancy.unit}, {vacancy.location}
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center gap-3">
                    {vacancy.status === 'open' ? (
                      <>
                        <StatusBadge tone="success">Dibuka</StatusBadge>
                        <span className="text-sm text-ink-700">
                          sampai {formatDate(vacancy.closesAt)}
                        </span>
                      </>
                    ) : (
                      <StatusBadge tone="neutral">Ditutup</StatusBadge>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
