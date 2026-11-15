import { DataNotice, EmptyState, formatDate } from '@agrabudi/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
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
          <ul className="divide-y divide-surface-100 border-y border-surface-100">
            {programs.data.map((program) => (
              <li
                key={program.id}
                className="grid gap-1 py-5 tablet:grid-cols-[16rem_minmax(0,1fr)] tablet:gap-8"
              >
                <p className="text-sm text-ink-700">
                  {formatDate(program.startsAt)} sampai {formatDate(program.endsAt)}
                </p>
                <div>
                  <h2 className="text-xl font-bold">
                    <Link
                      href={`/promo/${program.slug}`}
                      className="inline-flex min-h-11 items-center underline decoration-brand-red decoration-2 underline-offset-4"
                    >
                      {program.title}
                    </Link>
                  </h2>
                  <p className="max-w-prose text-sm text-ink-700">{program.summary}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
