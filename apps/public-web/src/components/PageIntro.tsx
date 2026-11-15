import { cn, containerClass } from '@agrabudi/ui';
import type { ReactNode } from 'react';

type PageIntroProps = {
  title: string;
  description?: string;
  /** Label asal data atau status, di kanan judul. */
  aside?: ReactNode;
  /** Tautan kembali, di atas judul. */
  back?: ReactNode;
};

/** Pembuka halaman dalam. Bukan hero: hanya judul, satu kalimat, dan garis merah merek. */
export function PageIntro({ title, description, aside, back }: PageIntroProps) {
  return (
    <div className="border-b border-surface-100 bg-surface-50">
      <div className={cn(containerClass, 'py-8 tablet:py-12')}>
        {back ? <div className="mb-4 text-sm">{back}</div> : null}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <span aria-hidden className="block h-1 w-12 bg-brand-red" />
            <h1 className="mt-4 text-3xl font-extrabold tablet:text-4xl">{title}</h1>
            {description ? <p className="mt-3 max-w-prose text-ink-700">{description}</p> : null}
          </div>
          {aside}
        </div>
      </div>
    </div>
  );
}

export const pageBodyClass = cn(containerClass, 'flex flex-col gap-10 py-8 tablet:py-12');
