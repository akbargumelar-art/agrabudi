import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { StatusIcon } from './Status';

type StateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

/** Keadaan kosong: jelaskan kenapa kosong dan apa langkah berikutnya. */
export function EmptyState({ title, description, action }: StateProps) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-panel border border-dashed border-ink-300 bg-surface-50 p-6">
      <h3 className="text-base font-bold text-ink-900">{title}</h3>
      {description ? <p className="max-w-prose text-sm text-ink-700">{description}</p> : null}
      {action}
    </div>
  );
}

/**
 * Keadaan gagal. Tidak boleh diganti data contoh secara diam-diam (PRD 3.3).
 * `requestId` ditampilkan bila ada supaya gangguan bisa ditelusuri (US-16).
 */
export function ErrorState({
  title,
  description,
  action,
  requestId,
}: StateProps & { requestId?: string }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-panel border border-danger bg-danger-soft p-6"
    >
      <div className="flex items-center gap-2 text-danger">
        <StatusIcon tone="danger" className="size-5" />
        <h3 className="text-base font-bold">{title}</h3>
      </div>
      {description ? <p className="max-w-prose text-sm text-ink-900">{description}</p> : null}
      {requestId ? <p className="text-xs text-ink-700">ID permintaan: {requestId}</p> : null}
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('animate-pulse rounded-control bg-surface-100', className)} />
  );
}

/** Penanda loading yang juga terbaca pembaca layar. */
export function LoadingBlock({
  label = 'Memuat data',
  rows = 3,
}: {
  label?: string;
  rows?: number;
}) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}
