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
