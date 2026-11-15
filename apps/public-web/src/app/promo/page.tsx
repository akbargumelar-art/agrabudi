import { DataNotice, EmptyState } from '@agrabudi/ui';
import type { Metadata } from 'next';
import { ProgramCard } from '@/components/listings';
import { SectionUnavailable } from '@/components/Notices';
import { PageIntro, pageBodyClass } from '@/components/PageIntro';
import { load } from '@/data';

export const metadata: Metadata = { title: 'Promo & Program' };

export default async function ProgramsPage() {
  const programs = await load((adapter) => adapter.listPrograms());
  return (
    <>
      <PageIntro
        title="Promo & Program"
        description="Promo dan program untuk pelanggan dan publik."
        aside={programs.ok ? <DataNotice meta={programs.meta} /> : null}
      />
      <div className={pageBodyClass}>
        {!programs.ok ? (
          <SectionUnavailable
            title="Promo dan program tidak dapat dimuat"
            message={programs.message}
          />
        ) : programs.data.length === 0 ? (
          <EmptyState
            title="Belum ada promo atau program"
            description="Program tampil setelah diterbitkan Admin program."
          />
        ) : (
          <ul className="grid gap-4 tablet:grid-cols-2">
            {programs.data.map((program, index) => (
              <li key={program.id}>
                <ProgramCard program={program} tone={index % 2 === 0 ? 'red' : 'navy'} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
