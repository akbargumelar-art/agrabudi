import type { AccountStatus, CredentialIssueResult } from '@agrabudi/contracts';
import { Button, DataNotice, Modal, StatusBadge } from '@agrabudi/ui';
import { FieldError } from '../../auth/adapter';

export type Errors = Record<string, string>;

export function errorsOf(cause: unknown): { message: string; fields: Errors } {
  if (cause instanceof FieldError) return { message: cause.message, fields: cause.fields };
  return {
    message: cause instanceof Error ? cause.message : 'Permintaan gagal. Coba lagi beberapa saat.',
    fields: {},
  };
}

/** Field form dari Zod `safeParse`: pesan pertama per kolom. */
export function zodErrors(issues: readonly { path: PropertyKey[]; message: string }[]): Errors {
  const fields: Errors = {};
  for (const issue of issues) fields[String(issue.path[0] ?? '_')] ??= issue.message;
  return fields;
}

export function AccountStatusBadge({
  status,
  mustChangePassword,
}: {
  status: AccountStatus;
  mustChangePassword: boolean;
}) {
  if (status === 'disabled') return <StatusBadge tone="neutral">Nonaktif</StatusBadge>;
  if (mustChangePassword) return <StatusBadge tone="warning">Menunggu ganti sandi</StatusBadge>;
  return <StatusBadge tone="success">Aktif</StatusBadge>;
}

/** Konfirmasi reset oleh admin. Aksi ini mencabut sesi pemilik akun, jadi tidak satu klik. */
export function ConfirmResetDialog({
  target,
  busy,
  onCancel,
  onConfirm,
}: {
  target: { label: string; phone: string } | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={target !== null}
      onClose={onCancel}
      title="Reset kata sandi?"
      footer={
        <>
          <Button size="sm" variant="secondary" onClick={onCancel}>
            Batal
          </Button>
          <Button size="sm" disabled={busy} onClick={onConfirm}>
            {busy ? 'Mengirim…' : 'Reset dan kirim ke WhatsApp'}
          </Button>
        </>
      }
    >
      <p className="text-sm">
        Kata sandi <strong>{target?.label}</strong> diganti dengan kata sandi sementara baru yang
        dikirim ke WhatsApp {target?.phone}. Sesi akun itu di semua perangkat langsung keluar.
      </p>
    </Modal>
  );
}

/**
 * Hasil membuat akun atau reset. Mode `api`: hanya nomor tujuan tersamar; kata sandi tidak
 * pernah sampai ke browser admin. Mode `mock`: kata sandi contoh berlabel.
 */
export function IssuedDialog({
  result,
  label,
  onClose,
}: {
  result: CredentialIssueResult | null;
  label: string;
  onClose: () => void;
}) {
  return (
    <Modal
      open={result !== null}
      onClose={onClose}
      title="Kata sandi sementara dikirim"
      footer={
        <Button size="sm" onClick={onClose}>
          Selesai
        </Button>
      }
    >
      {result?.delivery.channel === 'whatsapp' ? (
        <div className="flex flex-col gap-3 text-sm" data-testid="hasil-kirim">
          <StatusBadge tone="success">Terkirim ke WhatsApp</StatusBadge>
          <p>
            Kata sandi sementara untuk <strong>{label}</strong> sudah dikirim ke{' '}
            <strong>{result.delivery.maskedPhone}</strong>. Pemilik akun wajib menggantinya saat
            pertama masuk.
          </p>
          <p className="text-ink-700">Kata sandi tidak ditampilkan di sini dan tidak disimpan.</p>
        </div>
      ) : result?.delivery.channel === 'mock' ? (
        <div className="flex flex-col gap-3 text-sm" data-testid="hasil-kirim">
          <DataNotice meta={{ source: 'mock', asOf: new Date().toISOString() }} />
          <p>
            Mode contoh tidak mengirim WhatsApp. Kata sandi sementara contoh untuk{' '}
            <strong>{label}</strong>:
          </p>
          <p className="font-mono text-base font-bold">{result.delivery.temporaryPassword}</p>
          <p className="text-ink-700">
            Di server sungguhan kata sandi acak dikirim ke WhatsApp pemilik akun dan tidak pernah
            tampil di layar admin.
          </p>
        </div>
      ) : null}
    </Modal>
  );
}
