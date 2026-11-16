'use client';

import { Button, StatusIcon } from '@agrabudi/ui';
import { useState, type FormEvent, type ReactNode } from 'react';
import { usesMockData } from '@/lib/env';

type DemoFormProps = {
  /** Awalan nomor referensi, mis. "MNT" untuk minat IndiHome. */
  refPrefix: string;
  submitLabel: string;
  successTitle: string;
  successText: string;
  children: ReactNode;
  className?: string;
};

function referenceNumber(prefix: string): string {
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

/**
 * Form publik. Pada mode data contoh, kiriman tidak dikirim ke mana pun: form hanya
 * diperiksa lalu menampilkan nomor referensi contoh. Pada sumber data `api` yang belum
 * terhubung, form menolak dengan pesan yang jujur (PRD AS-09).
 *
 * Atribut data-* dipakai juga oleh skrip pratinjau statis, jadi jangan diganti nama.
 */
export function DemoForm({
  refPrefix,
  submitLabel,
  successTitle,
  successText,
  children,
  className,
}: DemoFormProps) {
  const [reference, setReference] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
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
    if (!usesMockData) {
      setError('Layanan pengiriman form belum terhubung. Coba lagi setelah layanan aktif.');
      return;
    }
    setReference(referenceNumber(refPrefix));
  }

  if (reference) {
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
          Nomor referensi: <strong data-demo-reference>{reference}</strong>
        </p>
        <p className="text-xs text-ink-700">
          Mode contoh: isi form tidak dikirim ke mana pun dan nomor ini tidak tercatat.
        </p>
        <Button variant="secondary" size="sm" onClick={() => setReference(null)}>
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
      onSubmit={onSubmit}
      className={className ?? 'flex flex-col gap-4'}
    >
      {children}
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
