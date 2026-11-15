import { AsyncView, DataNotice, EmptyState, PageHeader, formatDate } from '@agrabudi/ui';
import { Link } from 'react-router';
import { usePrograms } from '../../data/queries';

export function ProgramsPage() {
  const programs = usePrograms();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Promo & Program"
        description="Program yang ditujukan untuk mitra outlet, lengkap dengan periode dan syaratnya."
        aside={programs.data ? <DataNotice meta={programs.data.meta} /> : null}
      />
      <AsyncView
        state={programs}
        errorTitle="Daftar program tidak dapat dimuat"
        loadingLabel="Memuat program"
      >
        {(envelope) =>
          envelope.data.length === 0 ? (
            <EmptyState
              title="Belum ada program untuk outlet"
              description="Program baru muncul di sini setelah diterbitkan Admin program."
            />
          ) : (
            <ul className="divide-y divide-surface-100 border-y border-surface-100">
              {envelope.data.map((program) => (
                <li
                  key={program.id}
                  className="grid gap-1 py-4 tablet:grid-cols-[14rem_minmax(0,1fr)] tablet:gap-6"
                >
                  <p className="text-sm text-ink-700">
                    {formatDate(program.startsAt)} sampai {formatDate(program.endsAt)}
                  </p>
                  <div>
                    <h2 className="text-lg font-bold">
                      <Link
                        to={`/program/${program.slug}`}
                        className="underline decoration-brand-red underline-offset-4"
                      >
                        {program.title}
                      </Link>
                    </h2>
                    <p className="mt-1 max-w-prose text-sm text-ink-700">{program.summary}</p>
                  </div>
                </li>
              ))}
            </ul>
          )
        }
      </AsyncView>
    </div>
  );
}
