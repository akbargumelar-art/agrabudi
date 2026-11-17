import { type OutletQuote } from '@agrabudi/contracts';
import { ApiRequestError, newIdempotencyKey } from '@agrabudi/contracts/http';
import { Button, StatusBadge, formatDateTime, formatRupiah } from '@agrabudi/ui';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useCreateOrder, useCreateQuote } from '../../data/queries';
import type { CartLine } from '../abkshop/cart-math';
import { useCart } from '../abkshop/CartContext';

type SubmitOrderProps = {
  digiposId: string;
  lines: CartLine[];
  estimateRupiah: number;
};

/** Tanda isi keranjang, supaya quote lama tidak dipakai setelah jumlah diubah. */
const signatureOf = (lines: CartLine[]) =>
  lines.map((line) => `${line.pkg.id}:${line.qty}`).join('|');

function messageOf(error: unknown): string {
  if (error instanceof ApiRequestError) {
    const firstField = Object.values(error.fields)[0];
    return firstField ? `${error.message} ${firstField}` : error.message;
  }
  return error instanceof Error ? error.message : 'Terjadi gangguan. Coba lagi beberapa saat.';
}

/**
 * Dua langkah sesuai PRD 2.7: minta harga final ke server (quote), tinjau, lalu ajukan order.
 * Kunci idempotensi dibuat sekali per quote dan dipakai ulang saat tombol ditekan lagi setelah
 * gangguan, sehingga retry tidak membuat order kedua (US-06). Sukses hanya tampil setelah
 * server mengonfirmasi order tersimpan.
 */
export function SubmitOrder({ digiposId, lines, estimateRupiah }: SubmitOrderProps) {
  const navigate = useNavigate();
  const { clear } = useCart();
  const createQuote = useCreateQuote(digiposId);
  const createOrder = useCreateOrder(digiposId);
  const [quoted, setQuoted] = useState<{
    quote: OutletQuote;
    signature: string;
    key: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signature = signatureOf(lines);
  const quote = quoted && quoted.signature === signature ? quoted.quote : null;
  const busy = createQuote.isPending || createOrder.isPending;

  async function requestQuote() {
    setError(null);
    try {
      const envelope = await createQuote.mutateAsync({
        items: lines.map((line) => ({ packageId: line.pkg.id, qty: line.qty })),
      });
      setQuoted({ quote: envelope.data, signature, key: newIdempotencyKey() });
    } catch (cause) {
      setQuoted(null);
      setError(messageOf(cause));
    }
  }

  async function submit() {
    if (!quoted || !quote) return;
    setError(null);
    try {
      const envelope = await createOrder.mutateAsync({
        quoteId: quote.id,
        idempotencyKey: quoted.key,
      });
      clear();
      navigate(`/pesanan/${encodeURIComponent(envelope.data.id)}`, {
        state: { justCreated: true },
      });
    } catch (cause) {
      if (
        cause instanceof ApiRequestError &&
        ['QUOTE_CHANGED', 'QUOTE_EXPIRED', 'CONFLICT'].includes(cause.code)
      ) {
        setQuoted(null);
      }
      setError(messageOf(cause));
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      {quote ? (
        <div
          className="rounded-control border border-surface-100 bg-white p-3 text-sm"
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold">Harga final dari server</p>
            <StatusBadge tone="success">Terkunci</StatusBadge>
          </div>
          <p className="mt-2 flex items-baseline justify-between gap-3">
            <span className="text-ink-700">Total</span>
            <strong data-testid="quote-total" className="font-display text-lg">
              {formatRupiah(quote.totalRupiah)}
            </strong>
          </p>
          {quote.totalRupiah !== estimateRupiah ? (
            <p className="mt-1 font-medium text-danger">
              Total berbeda dari estimasi karena harga di server berubah. Periksa sebelum
              mengajukan.
            </p>
          ) : null}
          <p className="mt-1 text-xs text-ink-700">
            Berlaku sampai {formatDateTime(quote.expiresAt)}.
          </p>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}

      {quote ? (
        <Button block disabled={busy} onClick={() => void submit()}>
          {createOrder.isPending ? 'Mengajukan order...' : 'Ajukan order'}
        </Button>
      ) : (
        <Button block disabled={busy || lines.length === 0} onClick={() => void requestQuote()}>
          {createQuote.isPending ? 'Memeriksa harga...' : 'Periksa harga final'}
        </Button>
      )}
      <p className="text-xs text-ink-700">
        Order baru berstatus Diajukan dan menunggu verifikasi Admin. Belum berarti dibayar.
      </p>
    </div>
  );
}
