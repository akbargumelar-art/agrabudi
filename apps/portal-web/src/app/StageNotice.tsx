/**
 * Penanda tahap kerangka. Portal belum punya login maupun data, jadi tampilannya
 * tidak mewakili hak akses peran mana pun (PRD 5.1 tahap 1: tidak ada role confusion).
 */
export function StageNotice() {
  return (
    <p
      data-stage-notice
      className="border-b border-warning bg-warning-soft px-4 py-1.5 text-center text-xs font-medium text-warning"
    >
      Kerangka tampilan: Portal belum memakai login dan belum menampilkan data.
    </p>
  );
}
