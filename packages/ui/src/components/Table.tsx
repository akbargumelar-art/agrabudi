import type { ReactNode } from 'react';

type TableScrollProps = {
  /** Nama tabel untuk pembaca layar. */
  label: string;
  /** Petunjuk geser di smartphone, contoh: "Geser untuk melihat harga dan jumlah". */
  scrollHint?: string;
  children: ReactNode;
};

/**
 * Tabel tetap tabel di smartphone: scroll di dalam kontainer, bukan seluruh halaman (PRD 2.2).
 */
export function TableScroll({ label, scrollHint, children }: TableScrollProps) {
  return (
    <div>
      {scrollHint ? <p className="mb-2 text-xs text-ink-500 tablet:hidden">{scrollHint}</p> : null}
      <div
        role="region"
        aria-label={label}
        tabIndex={0}
        data-table-scroll
        className="overflow-x-auto rounded-panel border border-surface-100"
      >
        {children}
      </div>
    </div>
  );
}

export const tableClass = 'w-full border-collapse text-left text-sm';
export const thClass =
  'border-b border-surface-100 bg-surface-50 px-3 py-2.5 text-xs font-semibold whitespace-nowrap text-ink-700';
export const tdClass = 'border-b border-surface-100 px-3 py-3 align-top';
