import {
  AsyncView,
  DataNotice,
  EmptyState,
  MediaPlaceholder,
  PageHeader,
  buttonClass,
  formatDate,
} from '@agrabudi/ui';
import { Link, useParams } from 'react-router';
import { useProgram } from '../../data/queries';

export function ProgramDetailPage() {
  const { slug = '' } = useParams();
  const program = useProgram(slug);
  return (
    <div className="flex flex-col gap-6">
      <Link to="/program" className="text-sm font-medium text-info underline">
        Kembali ke daftar program
      </Link>
      <AsyncView
        state={program}
        errorTitle="Detail program tidak dapat dimuat"
        loadingLabel="Memuat program"
      >
        {(envelope) => {
          const detail = envelope.data;
          if (!detail) {
            return (
              <EmptyState
                title="Program tidak ditemukan"
                description="Program ini sudah berakhir atau tidak ditujukan untuk outlet Anda."
                action={
                  <Link to="/program" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
                    Lihat semua program
                  </Link>
                }
              />
            );
          }
          return (
            <>
              <PageHeader
                title={detail.title}
                description={`Berlaku ${formatDate(detail.startsAt)} sampai ${formatDate(detail.endsAt)}`}
                aside={<DataNotice meta={envelope.meta} />}
              />
              {detail.imageUrl ? (
                <img
                  src={detail.imageUrl}
                  alt={`Gambar ${detail.title}`}
                  className="aspect-16/9 w-full max-w-3xl rounded-panel object-cover"
                />
              ) : (
                <MediaPlaceholder
                  label={`Gambar ${detail.title} belum tersedia`}
                  className="aspect-16/9 w-full max-w-3xl rounded-panel"
                />
              )}
              <p className="max-w-prose text-ink-700">{detail.summary}</p>
              <section aria-labelledby="syarat-program">
                <h2 id="syarat-program" className="text-lg font-bold">
                  Syarat dan ketentuan
                </h2>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-900">
                  {detail.terms.map((term) => (
                    <li key={term}>{term}</li>
                  ))}
                </ul>
              </section>
            </>
          );
        }}
      </AsyncView>
    </div>
  );
}
