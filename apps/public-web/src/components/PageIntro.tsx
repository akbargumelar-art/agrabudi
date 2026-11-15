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

/** Pembuka halaman dalam: panel lembut dengan motif sinyal, bukan hero. */
export function PageIntro({ title, description, aside, back }: PageIntroProps) {
  return (
    <div className={cn(containerClass, 'pt-4 tablet:pt-6')}>
      <div className="relative overflow-hidden rounded-banner bg-surface-50 px-6 py-8 tablet:px-12 tablet:py-12">
        <SignalRings className="pointer-events-none absolute -right-8 -bottom-8 size-48 text-ink-300 opacity-50 tablet:size-72" />
        <div className="relative">
          {back ? <div className="mb-3 text-sm">{back}</div> : null}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-3xl font-extrabold tablet:text-4xl">{title}</h1>
              {description ? <p className="mt-3 max-w-prose text-ink-700">{description}</p> : null}
            </div>
            {aside}
          </div>
        </div>
      </div>
    </div>
  );
}

export const pageBodyClass = cn(containerClass, 'flex flex-col gap-10 py-8 tablet:py-12');
