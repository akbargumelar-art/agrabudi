import { z } from 'zod';
import { rupiahSchema } from './meta';

/** Status order. Klik checkout tidak sama dengan dibayar (PRD 2.7). */
export const orderStatusSchema = z.enum([
  'diajukan',
  'dikonfirmasi',
  'diproses',
  'selesai',
  'ditolak',
  'dibatalkan',
]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

/** Status pembayaran dipisah dari status order. */
export const paymentStatusSchema = z.enum([
  'belum_ditagih',
  'menunggu_pembayaran',
  'dibayar',
  'gagal',
  'kedaluwarsa',
]);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

/** Snapshot baris order: nama, isi, dan harga tidak ikut berubah saat katalog diedit. */
export const outletOrderItemSchema = z.object({
  packageId: z.string().min(1),
  nameSnapshot: z.string().min(1),
  contentsSnapshot: z.string(),
  unitPriceRupiah: rupiahSchema,
  qty: z.number().int().positive(),
  lineTotalRupiah: rupiahSchema,
});
export type OutletOrderItem = z.infer<typeof outletOrderItemSchema>;

export const outletOrderSchema = z.object({
  id: z.string().min(1),
  number: z.string().min(1),
  createdAt: z.iso.datetime(),
  status: orderStatusSchema,
  paymentStatus: paymentStatusSchema,
  items: z.array(outletOrderItemSchema).min(1),
  totalRupiah: rupiahSchema,
});
export type OutletOrder = z.infer<typeof outletOrderSchema>;

/**
 * Permintaan quote dari tabel ABKShop. Browser hanya mengirim ID paket dan jumlah;
 * harga, isi, dan aturan jumlah selalu diambil server dari katalog (PRD 2.7, 4.6).
 */
export const outletQuoteRequestSchema = z.object({
  items: z
    .array(
      z.object({
        packageId: z.string().min(1).max(64),
        qty: z.number().int().positive().max(1_000_000),
      }),
    )
    .min(1, 'Pilih minimal satu paket.')
    .max(200),
});
export type OutletQuoteRequest = z.infer<typeof outletQuoteRequestSchema>;

/**
 * Quote buatan server: harga terkunci sampai `expiresAt`. Diskon, ongkir, dan pajak
 * belum ada aturannya (TBD), jadi total ini subtotal barang saja.
 */
export const outletQuoteSchema = z.object({
  id: z.string().min(1),
  createdAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  items: z.array(outletOrderItemSchema).min(1),
  totalRupiah: rupiahSchema,
});
export type OutletQuote = z.infer<typeof outletQuoteSchema>;

/** Order dibuat dari quote yang masih berlaku, dengan header Idempotency-Key. */
export const createOutletOrderSchema = z.object({
  quoteId: z.string().min(1).max(64),
});
export type CreateOutletOrder = z.infer<typeof createOutletOrderSchema>;

/**
 * Transisi status order. BASELINE USULAN dari alur PRD 2.7, belum SOP final:
 * Diajukan -> Dikonfirmasi -> Diproses -> Selesai, atau Ditolak/Dibatalkan.
 * Server memakai tabel ini sebagai aturan yang mengikat; UI hanya untuk menampilkan pilihan.
 */
export const ORDER_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  diajukan: ['dikonfirmasi', 'ditolak', 'dibatalkan'],
  dikonfirmasi: ['diproses', 'dibatalkan'],
  diproses: ['selesai', 'dibatalkan'],
  selesai: [],
  ditolak: [],
  dibatalkan: [],
};

/** Status yang wajib disertai alasan (PRD US-07: actor dan alasan tercatat). */
export const ORDER_STATUS_NEEDS_REASON: readonly OrderStatus[] = ['ditolak', 'dibatalkan'];

export const orderStatusChangeSchema = z.object({
  status: orderStatusSchema,
  reason: z.string().trim().max(300).nullable(),
});
export type OrderStatusChange = z.infer<typeof orderStatusChangeSchema>;

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}
