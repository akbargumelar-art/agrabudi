import { SignalRings, cn, containerClass } from '@agrabudi/ui';
import type { ReactNode } from 'react';

type PageIntroProps = {
  title: string;
  description?: string;
  /** Label asal data atau status, di kanan judul. */
  aside?: ReactNode;
  /** Tautan kembali, di atas judul. */
  back?: ReactNode;
};

/**
 * Pembuka halaman dalam: panel merah brand dengan motif sinyal, bukan hero.
 * Warna pekat dan bayangan di bawahnya membuat kepala halaman terbaca sebagai
 * bagian tersendiri, terpisah dari latar putih dan kartu isi.
 */
export function PageIntro({ title, description, aside, back }: PageIntroProps) {
  return (
    <div className={cn(containerClass, 'pt-4 tablet:pt-6')}>
      <div className="on-dark relative overflow-hidden rounded-banner bg-brand-red px-6 py-8 text-white shadow-raised tablet:px-12 tablet:py-12">
        <SignalRings className="pointer-events-none absolute -right-8 -bottom-8 size-48 text-white opacity-15 tablet:size-72" />
        <div className="relative">
          {/* Tautan kembali dari halaman memakai warna info; di atas merah dipaksa putih. */}
          {back ? <div className="mb-3 text-sm [&_a]:text-white">{back}</div> : null}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-3xl font-extrabold tablet:text-4xl">{title}</h1>
              {description ? <p className="mt-3 max-w-prose text-white/90">{description}</p> : null}
            </div>
            {aside}
          </div>
        </div>
      </div>
    </div>
  );
}

export const pageBodyClass = cn(containerClass, 'flex flex-col gap-10 py-8 tablet:py-12');
