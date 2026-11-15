/** Lebar isi bersama untuk header dan halaman. */
export const containerClass = 'mx-auto w-full max-w-[80rem] px-4 tablet:px-6';

/**
 * Ruang bawah untuk halaman yang memakai BottomNav, supaya isi terakhir
 * tidak tertutup navigasi dan safe area perangkat.
 */
export const bottomNavOffsetClass = 'pb-[calc(5rem+env(safe-area-inset-bottom))] tablet:pb-0';

/** Kartu dan panel: sudut besar, garis tipis, tanpa bayangan. */
export const cardClass = 'rounded-panel border border-surface-100 bg-surface-0';

/** Tautan "lihat semua" di kanan judul bagian. */
export const moreLinkClass =
  'inline-flex min-h-11 items-center gap-1 text-sm font-semibold whitespace-nowrap text-brand-red-strong hover:underline';
