import { DataNotice, MediaPlaceholder, formatDate } from '@agrabudi/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SectionUnavailable } from '@/components/Notices';
import { PageIntro, pageBodyClass } from '@/components/PageIntro';
import { load } from '@/data';

export const metadata: Metadata = { title: 'Detail program' };

type ProgramPageProps = { params: Promise<{ slug: string }> };

const back = (
  <Link href="/promo" className="font-medium text-info underline">
    Semua promo dan program
  </Link>
);

export default async function ProgramPage({ params }: ProgramPageProps) {
  const { slug } = await params;
  const program = await load((adapter) => adapter.getProgram(slug));

  if (!program.ok) {
    return (
      <>
        <PageIntro title="Detail program" back={back} />
        <div className={pageBodyClass}>
          <SectionUnavailable title="Program tidak dapat dimuat" message={program.message} />
        </div>
      </>
    );
  }
  if (!program.data) notFound();
  const detail = program.data;

  return (
    <>
      <PageIntro
        title={detail.title}
        description={`Berlaku ${formatDate(detail.startsAt)} sampai ${formatDate(detail.endsAt)}`}
        back={back}
        aside={<DataNotice meta={program.meta} />}
      />
      <div className={pageBodyClass}>
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
        <p className="max-w-prose text-ink-900">{detail.summary}</p>
        <section aria-labelledby="syarat">
          <h2 id="syarat" className="text-xl font-bold">
            Syarat dan ketentuan
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            {detail.terms.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
