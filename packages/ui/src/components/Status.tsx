import { CircleAlert, CircleCheck, CircleX, Clock, Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const toneIcon = {
  success: CircleCheck,
  warning: CircleAlert,
  danger: CircleX,
  info: Info,
  neutral: Clock,
} as const;

const toneClass: Record<StatusTone, string> = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  neutral: 'bg-surface-100 text-ink-700',
};

export function StatusIcon({ tone, className }: { tone: StatusTone; className?: string }) {
  const Icon = toneIcon[tone];
  return <Icon aria-hidden className={className} />;
}

/** Status selalu membawa ikon dan teks, tidak hanya warna (PRD AS-08). */
export function StatusBadge({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
        toneClass[tone],
      )}
    >
      <StatusIcon tone={tone} className="size-3.5" />
      {children}
    </span>
  );
}
