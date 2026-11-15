/**
 * Penanda tahap kerangka. Login memakai akun contoh dan menu disaring di browser saja;
 * pembatasan akses yang mengikat dilakukan server dan belum dibuat (PRD 4.13).
 */
export function StageNotice() {
  return (
    <p
      data-stage-notice
      className="border-b border-warning bg-warning-soft px-4 py-1.5 text-center text-xs font-medium text-warning"
    >
      Kerangka tampilan: login memakai akun contoh, belum ada data, dan pembatasan akses baru di
      tampilan.
    </p>
  );
}
