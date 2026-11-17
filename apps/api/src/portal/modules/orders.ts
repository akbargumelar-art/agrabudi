import type { OrderStatus, PaymentStatus } from '@agrabudi/contracts';
import { sql } from 'kysely';
import { changeOrderStatus } from '../../domain/orders';
import { conflict } from '../../lib/errors';
import { count, dateOf, row, type PortalModule } from '../types';

export const ORDER_STATUS_LABEL: Readonly<Record<OrderStatus, string>> = {
  diajukan: 'Diajukan',
  dikonfirmasi: 'Dikonfirmasi',
  diproses: 'Diproses',
  selesai: 'Selesai',
  ditolak: 'Ditolak',
  dibatalkan: 'Dibatalkan',
};

const PAYMENT_STATUS_LABEL: Readonly<Record<PaymentStatus, string>> = {
  belum_ditagih: 'Belum ditagih',
  menunggu_pembayaran: 'Menunggu pembayaran',
  dibayar: 'Dibayar',
  gagal: 'Gagal',
  kedaluwarsa: 'Kedaluwarsa',
};

/**
 * Verifikasi dan pemrosesan order ABKShop Outlet (US-07). Admin hanya mengubah status
 * sesuai transisi yang sah, dengan alasan untuk Ditolak/Dibatalkan. Order tidak dibuat
 * atau dihapus dari Portal; isi dan total order tidak bisa diubah.
 */
export const outletOrdersModule: PortalModule = {
  path: '/admin/abkshop-outlet/order',
  description: 'Order dari ABKShop Outlet. Status order dan status pembayaran terpisah.',
  canCreate: false,
  canDelete: false,
  filters: ['status', 'pembayaran'],
  columns: () => [
    { key: 'nomor', label: 'Nomor order', kind: 'id' },
    { key: 'outlet', label: 'Outlet', kind: 'text' },
    { key: 'digipos', label: 'ID Digipos', kind: 'id' },
    { key: 'tanggal', label: 'Tanggal', kind: 'date' },
    { key: 'paket', label: 'Jumlah paket', kind: 'number' },
    { key: 'total', label: 'Total', kind: 'rupiah' },
    {
      key: 'status',
      label: 'Status order',
      kind: 'status',
      editable: true,
      required: true,
      options: Object.values(ORDER_STATUS_LABEL),
    },
    { key: 'alasan', label: 'Alasan perubahan status', kind: 'longtext', editable: true },
    { key: 'pembayaran', label: 'Pembayaran', kind: 'status' },
  ],
  async list({ db }) {
    const rows = await db
      .selectFrom('outletOrders as o')
      .innerJoin('outletAccounts as a', 'a.id', 'o.outletAccountId')
      .leftJoin('outletOrderItems as i', 'i.orderId', 'o.id')
      .select([
        'o.id',
        'o.number',
        'o.createdAt',
        'o.status',
        'o.paymentStatus',
        'o.totalRupiah',
        'a.outletName',
        'a.digiposId',
        sql<number>`COALESCE(SUM(i.qty), 0)`.as('qty'),
      ])
      .groupBy('o.id')
      .orderBy('o.createdAt', 'desc')
      .limit(500)
      .execute();
    return rows.map((item) =>
      row(item.id, {
        nomor: item.number,
        outlet: item.outletName,
        digipos: item.digiposId,
        tanggal: dateOf(item.createdAt),
        paket: Number(item.qty),
        total: item.totalRupiah,
        status: ORDER_STATUS_LABEL[item.status],
        alasan: null,
        pembayaran: PAYMENT_STATUS_LABEL[item.paymentStatus],
      }),
    );
  },
  async save(ctx, id, cells) {
    if (!id) throw conflict('Order hanya dibuat oleh mitra outlet lewat ABKShop.');
    const status = cells.option('status', ORDER_STATUS_LABEL);
    const reason = cells.optionalText('alasan', 300);
    cells.done();
    const current = await ctx.db
      .selectFrom('outletOrders')
      .select('status')
      .where('id', '=', id)
      .executeTakeFirst();
    // Simpan tanpa mengganti status tidak mencatat apa pun.
    if (current?.status === status) return id;
    await changeOrderStatus(ctx.db, ctx.actor, id, status, reason, ctx.requestId);
    return id;
  },
  stats: (rows) => [
    {
      label: 'Menunggu verifikasi',
      value: count(rows.filter((item) => item.cells.status === 'Diajukan').length),
    },
    {
      label: 'Diproses',
      value: count(rows.filter((item) => item.cells.status === 'Diproses').length),
    },
    { label: 'Order', value: count(rows.length) },
  ],
};
