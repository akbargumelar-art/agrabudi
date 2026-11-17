'use client';

import { IDEMPOTENCY_HEADER, formReceiptSchema } from '@agrabudi/contracts';
import { ApiRequestError, apiRequest, newIdempotencyKey } from '@agrabudi/contracts/http';
import { Button, StatusIcon } from '@agrabudi/ui';
import { useState, type FormEvent, type ReactNode } from 'react';
import { usesMockData } from '@/lib/env';

type PublicFormProps = {
  /** Path form di API publik, mis. "contact" atau "job-application/salesforce-mobile". */
  endpoint: string;
  /** Kirim sebagai multipart karena ada berkas (lamaran dengan CV). */
  withFile?: boolean;
  /** Awalan nomor referensi contoh di mode data contoh, mis. "MNT". */
  refPrefix: string;
  submitLabel: string;
  successTitle: string;
  successText: string;
  children: ReactNode;
  className?: string;
};

function sampleReference(prefix: string): string {
  const now = new Date();
  const date = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `${prefix}-${date}-${random}`;
}

/** Periksa batas ukuran berkas yang ditandai `data-max-bytes`. */
function oversizedFile(form: HTMLFormElement): HTMLInputElement | null {
  for (const input of form.querySelectorAll<HTMLInputElement>(
    'input[type="file"][data-max-bytes]',
  )) {
    const max = Number(input.dataset.maxBytes);
    const file = input.files?.[0];
    if (file && file.size > max) return input;
  }
  return null;
}

function fieldsOf(form: HTMLFormElement): Record<string, string> {
  const values: Record<string, string> = {};
  new FormData(form).forEach((value, key) => {
    if (typeof value === 'string') values[key] = value;
  });
  return values;
}

/**
 * Form publik. Mode `api`: isian dikirim ke /api/public/v1/forms, nomor referensi dibuat
 * server, dan sukses hanya tampil setelah server menyimpan kiriman (US-09). Kunci
 * idempotensi dipakai ulang bila tombol ditekan lagi setelah gangguan, supaya tidak dobel.
 * Mode data contoh: tidak ada yang dikirim; nomor referensi berlabel contoh.
 *
 * Atribut data-* dipakai juga oleh skrip pratinjau statis, jadi jangan diganti nama.
 */
export function PublicForm({
  endpoint,
  withFile = false,
  refPrefix,
  submitLabel,
  successTitle,
  successText,
  children,
  className,
}: PublicFormProps) {
  const [receipt, setReceipt] = useState<{ reference: string; sample: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [attemptKey, setAttemptKey] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    const tooBig = oversizedFile(form);
    if (tooBig) {
      tooBig.setCustomValidity('Ukuran berkas melebihi 2 MB.');
    }
    if (!form.checkValidity()) {
      form.reportValidity();
      tooBig?.setCustomValidity('');
      return;
    }
    if (usesMockData) {
      setReceipt({ reference: sampleReference(refPrefix), sample: true });
      return;
    }

    const key = attemptKey ?? newIdempotencyKey();
    setAttemptKey(key);
    setBusy(true);
    try {
      const result = await apiRequest(`/api/public/v1/forms/${endpoint}`, formReceiptSchema, {
        method: 'POST',
        headers: { [IDEMPOTENCY_HEADER]: key },
        body: withFile ? new FormData(form) : fieldsOf(form),
      });
      setReceipt({ reference: result.reference, sample: false });
      setAttemptKey(null);
      form.reset();
    } catch (cause) {
      if (cause instanceof ApiRequestError) {
        const field = Object.values(cause.fields)[0];
        setError(field ? `${cause.message} ${field}` : cause.message);
        // Isian ditolak server: kiriman berikutnya adalah kiriman baru, bukan ulangan.
        if (cause.status === 422 || cause.status === 413 || cause.status === 415)
          setAttemptKey(null);
      } else {
        setError('Kiriman belum terkirim. Coba lagi beberapa saat.');
      }
    } finally {
      setBusy(false);
    }
  }

  if (receipt) {
    return (
      <div
        role="status"
        data-demo-success
        className="flex flex-col items-start gap-3 rounded-panel border border-success bg-success-soft p-6"
      >
        <div className="flex items-center gap-2 text-success">
          <StatusIcon tone="success" className="size-5" />
          <p className="font-bold">{successTitle}</p>
        </div>
        <p className="text-sm text-ink-900">{successText}</p>
        <p className="text-sm">
          Nomor referensi: <strong data-demo-reference>{receipt.reference}</strong>
        </p>
        {receipt.sample ? (
          <p className="text-xs text-ink-700">
            Mode contoh: isi form tidak dikirim ke mana pun dan nomor ini tidak tercatat.
          </p>
        ) : null}
        <Button variant="secondary" size="sm" onClick={() => setReceipt(null)}>
          Isi form lagi
        </Button>
      </div>
    );
  }

  return (
    <form
      data-demo-form
      data-ref-prefix={refPrefix}
      data-success-title={successTitle}
      data-success-text={successText}
      onSubmit={(event) => void onSubmit(event)}
      className={className ?? 'flex flex-col gap-4'}
    >
      {children}
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={busy}>
        {busy ? 'Mengirim...' : submitLabel}
      </Button>
    </form>
  );
}
