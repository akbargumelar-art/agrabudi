import { usesMockData } from './env';

/**
 * Penanda tahap kerangka, hanya di mode data contoh: akun dan data masih contoh, dan menu
 * disaring di browser saja. Di mode `api` akun dan izin diperiksa server, jadi penanda ini
 * tidak ditampilkan (kalimatnya akan menyesatkan).
 */
export function StageNotice() {
  if (!usesMockData) return null;
  return (
    <p
      data-stage-notice
      className="border-b border-warning bg-warning-soft px-4 py-1.5 text-center text-xs font-medium text-warning"
    >
      Kerangka tampilan: akun dan data masih contoh, dan pembatasan akses baru di tampilan.
    </p>
  );
}
