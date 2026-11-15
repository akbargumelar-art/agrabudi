import { ErrorState } from '@agrabudi/ui';

/**
 * Isi institusional yang belum ada. Tidak diisi teks karangan:
 * profil, alamat, kontak, dan klaim perusahaan harus dari sumber resmi (PRD 3.3).
 */
export function PendingContent({
  what,
  owner = 'Administrator Web',
}: {
  what: string;
  owner?: string;
}) {
  return (
    <div
      data-pending-content
      className="rounded-panel border border-dashed border-ink-300 bg-surface-50 p-5"
    >
      <p className="text-sm font-semibold text-ink-900">{what} belum diisi</p>
      <p className="mt-1 max-w-prose text-sm text-ink-700">
        Bagian ini diisi {owner} setelah isi resminya disahkan perusahaan.
      </p>
    </div>
  );
}

/** Bagian yang datanya gagal dimuat. Ditampilkan sebagai gangguan, bukan diganti data contoh. */
export function SectionUnavailable({ title, message }: { title: string; message: string }) {
  return <ErrorState title={title} description={message} />;
}

/** Catatan di bawah form yang pengirimannya belum aktif. */
export function InactiveFormNote({ id, children }: { id: string; children: string }) {
  return (
    <p id={id} className="text-sm font-medium text-ink-900">
      {children}
    </p>
  );
}
