/**
 * Penanda tahap kerangka. Akun dan data masih contoh, dan menu disaring di browser saja;
 * pembatasan akses yang mengikat dilakukan server dan belum dibuat (PRD 4.13).
 */
export function StageNotice() {
  return (
    <p
      data-stage-notice
      className="border-b border-warning bg-warning-soft px-4 py-1.5 text-center text-xs font-medium text-warning"
    >
      Kerangka tampilan: akun dan data masih contoh, dan pembatasan akses baru di tampilan.
    </p>
  );
}
