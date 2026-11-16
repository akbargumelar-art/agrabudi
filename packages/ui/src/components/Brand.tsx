import { ImageOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import type { IconComponent } from '../lib/nav';

/**
 * Motif merek: lingkaran sinyal. Dipakai di banner dan pembuka halaman sebagai
 * pengganti gambar sampai aset resmi tersedia (T-4). Warnanya mengikuti `currentColor`.
 */
export function SignalRings({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 400 400" fill="none" className={className}>
      {[40, 90, 140, 190, 240, 290].map((radius, index) => (
        <circle
          key={radius}
          cx="400"
          cy="400"
          r={radius}
          stroke="currentColor"
          strokeWidth={index % 2 === 0 ? 22 : 10}
          opacity={0.9 - index * 0.13}
        />
      ))}
    </svg>
  );
}

type SectionHeadingProps = {
  id?: string;
  title: string;
  description?: string;
  /** Label asal data atau tautan "lihat semua". */
  aside?: ReactNode;
  /** `sm` untuk judul di kolom sempit atau halaman kerja. */
  size?: 'md' | 'sm';
};

export function SectionHeading({
  id,
  title,
  description,
  aside,
  size = 'md',
}: SectionHeadingProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div className="min-w-0">
        <h2
          id={id}
          className={cn(
            'font-extrabold text-ink-900',
            size === 'md' ? 'text-2xl tablet:text-3xl' : 'text-xl tablet:text-2xl',
          )}
        >
          {title}
        </h2>
        {description ? <p className="mt-2 max-w-prose text-ink-700">{description}</p> : null}
      </div>
      {aside ? <div className="flex flex-wrap items-center gap-3">{aside}</div> : null}
    </div>
  );
}

type MediaPlaceholderProps = {
  /** Teks untuk pembaca layar, mis. "Foto Perdana Contoh 1 belum tersedia". */
  label: string;
  icon?: IconComponent;
  tone?: 'red' | 'ink' | 'neutral';
  className?: string;
};

const toneClass = {
  red: 'bg-brand-red-soft text-brand-red',
  ink: 'bg-ink-soft text-ink-800',
  neutral: 'bg-surface-50 text-ink-500',
} as const;

/**
 * Tempat gambar yang belum ada. Jujur berlabel, tidak memakai foto rekaan (PRD AS-06).
 */
export function MediaPlaceholder({
  label,
  icon: Icon = ImageOff,
  tone = 'neutral',
  className,
}: MediaPlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        'relative flex items-center justify-center overflow-hidden',
        toneClass[tone],
        className,
      )}
    >
      <SignalRings className="absolute -right-6 -bottom-6 size-40 opacity-25" />
      <Icon aria-hidden className="relative size-10" />
      <span aria-hidden className="absolute bottom-2 left-3 text-xs font-medium opacity-80">
        Foto belum tersedia
      </span>
    </div>
  );
}

/** Ikon di dalam lingkaran lembut, untuk pintasan dan daftar manfaat. */
export function IconBadge({
  icon: Icon,
  tone = 'red',
}: {
  icon: IconComponent;
  tone?: 'red' | 'ink';
}) {
  return (
    <span
      className={cn(
        'inline-flex size-12 shrink-0 items-center justify-center rounded-full',
        tone === 'red' ? 'bg-brand-red-soft text-brand-red' : 'bg-ink-soft text-ink-800',
      )}
    >
      <Icon aria-hidden className="size-6" />
    </span>
  );
}
