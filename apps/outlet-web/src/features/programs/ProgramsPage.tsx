import {
  AsyncView,
  DataNotice,
  EmptyState,
  PageHeader,
  cardClass,
  cn,
  formatDate,
} from '@agrabudi/ui';
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
            <ul className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
              {envelope.data.map((program) => (
                <li key={program.id}>
                  <Link
                    to={`/program/${program.slug}`}
                    className={cn(
                      cardClass,
                      'flex h-full flex-col overflow-hidden hover:border-ink-300',
                    )}
                  >
                    {program.imageUrl ? (
                      <img
                        src={program.imageUrl}
                        alt={`Gambar ${program.title}`}
                        loading="lazy"
                        className="aspect-16/9 w-full object-cover"
                      />
                    ) : null}
                    <span className="flex flex-1 flex-col gap-1.5 p-5">
                      <span className="text-sm text-ink-700">
                        {formatDate(program.startsAt)} sampai {formatDate(program.endsAt)}
                      </span>
                      <span className="text-lg font-bold">{program.title}</span>
                      <span className="text-sm text-ink-700">{program.summary}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )
        }
      </AsyncView>
    </div>
  );
}
