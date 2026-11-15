import { cn } from '../lib/cn';

type WordmarkProps = {
  /** Nama aplikasi di samping merek, misalnya "Outlet". Kosongkan untuk Publik. */
  app?: string;
  tone?: 'dark' | 'light';
};

/**
 * Merek berupa teks biasa, bukan logo. Logo resmi belum tersedia (keputusan
 * terbuka T-4) dan tidak boleh direka (PRD AS-06). Ganti komponen ini saja
 * setelah file logo resmi ada.
 */
export function Wordmark({ app, tone = 'light' }: WordmarkProps) {
  const dark = tone === 'dark';
  return (
    <span className="inline-flex items-baseline gap-2 font-display">
      <span className={cn('text-lg font-extrabold', dark ? 'text-white' : 'text-ink-900')}>
        Agrabudi
      </span>
      {app ? (
        <span className={cn('text-sm font-semibold', dark ? 'text-ink-300' : 'text-ink-500')}>
          {app}
        </span>
      ) : null}
    </span>
  );
}
