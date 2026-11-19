import { cardClass, cn } from '@agrabudi/ui';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

type CollapsibleSectionProps = {
  id: string;
  title: string;
  /** Ringkasan satu baris di bawah judul, terlihat saat bagian tertutup. */
  summary?: string;
  children: ReactNode;
};

/**
 * Bagian yang bisa dibuka-tutup memakai <details> bawaan browser: jalan tanpa
 * JavaScript, bisa dengan keyboard, dan isinya tetap terbaca mesin pencari.
 */
export function CollapsibleSection({ id, title, summary, children }: CollapsibleSectionProps) {
  return (
    <details id={id} className={cn(cardClass, 'group')}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <h2 className="text-lg font-bold">{title}</h2>
          {summary ? <span className="mt-0.5 block text-sm text-ink-700">{summary}</span> : null}
        </span>
        <span
          aria-hidden
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-red-soft text-brand-red transition-transform group-open:rotate-180"
        >
          <ChevronDown className="size-5" />
        </span>
      </summary>
      <div className="border-t border-surface-100 px-5 py-5">{children}</div>
    </details>
  );
}
