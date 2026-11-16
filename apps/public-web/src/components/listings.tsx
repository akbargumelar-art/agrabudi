import type { Program, Vacancy } from '@agrabudi/contracts';
import { MediaPlaceholder, StatusBadge, cardClass, cn, formatDate } from '@agrabudi/ui';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

/** Kartu promo/program dengan gambar di atas. */
export function ProgramCard({ program, tone }: { program: Program; tone: 'red' | 'ink' }) {
  return (
    <Link
      href={`/promo/${program.slug}`}
      className={cn(cardClass, 'flex h-full flex-col overflow-hidden hover:border-ink-300')}
    >
      {program.imageUrl ? (
        <img
          src={program.imageUrl}
          alt={`Gambar ${program.title}`}
          loading="lazy"
          className="aspect-16/9 w-full object-cover"
        />
      ) : (
        <MediaPlaceholder
          label={`Gambar ${program.title} belum tersedia`}
          tone={tone}
          className="aspect-16/9 w-full"
        />
      )}
      <span className="flex flex-1 flex-col gap-2 p-5 tablet:p-6">
        <span className="text-sm text-ink-700">
          {formatDate(program.startsAt)} sampai {formatDate(program.endsAt)}
        </span>
        <span className="font-display text-xl font-bold">{program.title}</span>
        <span className="max-w-prose text-sm text-ink-700">{program.summary}</span>
        <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-semibold text-brand-red-strong">
          Selengkapnya
          <ChevronRight aria-hidden className="size-4" />
        </span>
      </span>
    </Link>
  );
}

/** Daftar lowongan dalam satu panel. */
export function VacancyList({ vacancies }: { vacancies: Vacancy[] }) {
  return (
    <ul className={cn(cardClass, 'divide-y divide-surface-100 overflow-hidden')}>
      {vacancies.map((vacancy) => (
        <li key={vacancy.id}>
          <Link
            href={`/karir/${vacancy.slug}`}
            className="flex min-h-20 items-center justify-between gap-4 px-5 py-4 hover:bg-surface-50 tablet:px-6"
          >
            <span className="min-w-0">
              <span className="block font-display text-lg font-bold">{vacancy.title}</span>
              <span className="block text-sm text-ink-700">
                {vacancy.unit}, {vacancy.location}, {vacancy.employmentType.toLowerCase()}
              </span>
            </span>
            <span className="flex shrink-0 flex-wrap items-center justify-end gap-x-3 gap-y-1">
              {vacancy.status === 'open' ? (
                <>
                  <StatusBadge tone="success">Dibuka</StatusBadge>
                  <span className="hidden text-sm text-ink-700 tablet:inline">
                    sampai {formatDate(vacancy.closesAt)}
                  </span>
                </>
              ) : (
                <StatusBadge tone="neutral">Ditutup</StatusBadge>
              )}
              <ChevronRight aria-hidden className="size-5 text-ink-500" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
