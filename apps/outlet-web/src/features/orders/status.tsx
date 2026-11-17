import type { OrderStatus, PaymentStatus } from '@agrabudi/contracts';
import { StatusBadge, type StatusTone } from '@agrabudi/ui';

const orderStatus: Record<OrderStatus, { label: string; tone: StatusTone }> = {
  diajukan: { label: 'Diajukan', tone: 'neutral' },
  dikonfirmasi: { label: 'Dikonfirmasi', tone: 'info' },
  diproses: { label: 'Diproses', tone: 'info' },
  selesai: { label: 'Selesai', tone: 'success' },
  ditolak: { label: 'Ditolak', tone: 'danger' },
  dibatalkan: { label: 'Dibatalkan', tone: 'danger' },
};

const paymentStatus: Record<PaymentStatus, { label: string; tone: StatusTone }> = {
  belum_ditagih: { label: 'Belum ditagih', tone: 'neutral' },
  menunggu_pembayaran: { label: 'Menunggu pembayaran', tone: 'warning' },
  dibayar: { label: 'Dibayar', tone: 'success' },
  gagal: { label: 'Pembayaran gagal', tone: 'danger' },
  kedaluwarsa: { label: 'Tagihan kedaluwarsa', tone: 'danger' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, tone } = orderStatus[status];
  return <StatusBadge tone={tone}>{label}</StatusBadge>;
}

/** Status pembayaran selalu ditampilkan terpisah dari status order (PRD 2.7). */
export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { label, tone } = paymentStatus[status];
  return <StatusBadge tone={tone}>{label}</StatusBadge>;
}
