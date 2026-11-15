import { DataNotice, EmptyState } from '@agrabudi/ui';
import type { Metadata } from 'next';
import { VacancyList } from '@/components/listings';
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
          <VacancyList vacancies={vacancies.data} />
        )}
      </div>
    </>
  );
}
