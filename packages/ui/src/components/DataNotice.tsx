import type { DataMeta } from '@agrabudi/contracts';
import { FlaskConical } from 'lucide-react';
import { formatDateTime } from '../lib/format';
import { StatusBadge } from './Status';

/**
 * Label asal data. Data contoh dan data cache wajib ditandai supaya tidak
 * terbaca sebagai data resmi (PRD 3.3, US-16).
 */
export function DataNotice({ meta }: { meta: DataMeta }) {
  if (meta.source === 'api') return null;
  if (meta.source === 'cache') {
    return <StatusBadge tone="warning">Data tersimpan per {formatDateTime(meta.asOf)}</StatusBadge>;
  }
  return (
    <span
      data-mock-label
      title={meta.note ?? 'Data contoh untuk kerangka tampilan. Bukan data resmi.'}
      className="inline-flex items-center gap-1.5 rounded-full border border-warning bg-warning-soft px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-warning"
    >
      <FlaskConical aria-hidden className="size-3.5" />
      Data contoh
    </span>
  );
}

/** Pita global saat aplikasi berjalan dengan mock adapter. */
export function MockRibbon() {
  return (
    <p
      data-mock-ribbon
      className="border-b border-warning bg-warning-soft px-4 py-1.5 text-center text-xs font-medium text-warning"
    >
      Mode kerangka: isi dan angka di situs ini data contoh, bukan data resmi.
    </p>
  );
}
