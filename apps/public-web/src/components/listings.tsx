import type { Program, Vacancy } from '@agrabudi/contracts';
import { StatusBadge, cardClass, cn, formatDate } from '@agrabudi/ui';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

/** Kartu promo/program. Warna latar bergantian supaya daftar tidak seragam. */
export function ProgramCard({ program, tone }: { program: Program; tone: 'red' | 'navy' }) {
  return (
    <Link
      href={`/promo/${program.slug}`}
      className={cn(
        'flex h-full flex-col gap-2 rounded-panel p-6 tablet:p-8',
        tone === 'red' ? 'bg-brand-red-soft' : 'bg-ink-soft',
      )}
    >
      <span className="text-sm text-ink-700">
        {formatDate(program.startsAt)} sampai {formatDate(program.endsAt)}
      </span>
      <span className="font-display text-xl font-bold tablet:text-2xl">{program.title}</span>
      <span className="max-w-prose text-sm text-ink-700">{program.summary}</span>
      <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-brand-red-strong">
        Selengkapnya
        <ChevronRight aria-hidden className="size-4" />
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
                {vacancy.unit}, {vacancy.location}
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
