import {
  ORDER_STATUS_NEEDS_REASON,
  canTransition,
  type OrderStatus,
  type OutletOrder,
  type OutletQuote,
  type OutletQuoteRequest,
} from '@agrabudi/contracts';
import type { Transaction } from 'kysely';
import type { Db } from '../db/database';
import { isDuplicateKey } from '../db/database';
import type { Database, OutletPackageRow, QuoteLineJson } from '../db/types';
import { audit, type Actor } from '../lib/audit';
import { HttpError, conflict, invalid, notFound } from '../lib/errors';
import { newId, referenceNumber } from '../lib/ids';

/**
 * Aturan order ABKShop Outlet (PRD 2.7, 4.6, US-05 s.d. US-07). Satu-satunya tempat harga,
 * batas jumlah, dan transisi status ditetapkan; hitungan di browser hanya estimasi (AS-12).
 */

/** Pesan pelanggaran aturan jumlah, atau `null` bila jumlah sah. */
export function qtyViolation(
  pkg: Pick<OutletPackageRow, 'minQty' | 'maxQty' | 'multipleOf'>,
  qty: number,
): string | null {
  if (!Number.isSafeInteger(qty) || qty <= 0) return 'Jumlah harus bilangan bulat lebih dari nol.';
  if (qty < pkg.minQty) return `Minimal ${pkg.minQty}.`;
  if (pkg.maxQty !== null && qty > pkg.maxQty) return `Maksimal ${pkg.maxQty}.`;
  if (qty % pkg.multipleOf !== 0) return `Harus kelipatan ${pkg.multipleOf}.`;
  return null;
}

function quoteFromRow(row: {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  items: QuoteLineJson[];
  totalRupiah: number;
}): OutletQuote {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    items: row.items.map((line) => ({
      packageId: line.packageId,
      nameSnapshot: line.nameSnapshot,
      contentsSnapshot: line.contentsSnapshot,
      unitPriceRupiah: line.unitPriceRupiah,
      qty: line.qty,
      lineTotalRupiah: line.lineTotalRupiah,
    })),
    totalRupiah: row.totalRupiah,
  };
}

/** Buat quote dari ID paket dan jumlah. Harga diambil dari katalog Outlet saat ini, bukan dari browser. */
export async function createQuote(
  db: Db,
  outletAccountId: string,
  request: OutletQuoteRequest,
  ttlMinutes: number,
): Promise<OutletQuote> {
  const ids = request.items.map((item) => item.packageId);
  if (new Set(ids).size !== ids.length) {
    throw invalid('Paket yang sama tidak boleh muncul dua kali.', {
      items: 'Gabungkan jumlah paket yang sama.',
    });
  }
  const packages = await db
    .selectFrom('outletPackages')
    .selectAll()
    .where('id', 'in', ids)
    .where('status', '=', 'published')
    .execute();
  const byId = new Map(packages.map((pkg) => [pkg.id, pkg]));

  const fields: Record<string, string> = {};
  const lines: QuoteLineJson[] = [];
  request.items.forEach((item, index) => {
    const pkg = byId.get(item.packageId);
    if (!pkg) {
      fields[`items.${index}.packageId`] = 'Paket tidak tersedia lagi.';
      return;
    }
    const problem = qtyViolation(pkg, item.qty);
    if (problem) {
      fields[`items.${index}.qty`] = `${pkg.name}: ${problem}`;
      return;
    }
    lines.push({
      packageId: pkg.id,
      nameSnapshot: pkg.name,
      contentsSnapshot: pkg.contents,
      unitPriceRupiah: pkg.unitPriceRupiah,
      priceVersion: pkg.priceVersion,
      qty: item.qty,
      lineTotalRupiah: pkg.unitPriceRupiah * item.qty,
    });
  });
  if (Object.keys(fields).length > 0)
    throw invalid('Ada paket atau jumlah yang belum sesuai aturan.', fields);

  const totalRupiah = lines.reduce((sum, line) => sum + line.lineTotalRupiah, 0);
  if (!Number.isSafeInteger(totalRupiah)) throw invalid('Total pesanan terlalu besar.');

  const now = new Date();
  const quote = {
    id: newId(),
    createdAt: now,
    expiresAt: new Date(now.getTime() + ttlMinutes * 60_000),
    items: lines,
    totalRupiah,
  };
  await db
    .insertInto('outletQuotes')
    .values({
      id: quote.id,
      outletAccountId,
      items: JSON.stringify(lines),
      totalRupiah,
      createdAt: now,
      expiresAt: quote.expiresAt,
    })
    .execute();
  return quoteFromRow(quote);
}

async function loadOrder(
  db: Db | Transaction<Database>,
  where: { id: string; outletAccountId?: string },
): Promise<OutletOrder | null> {
  let query = db.selectFrom('outletOrders').selectAll().where('id', '=', where.id);
  if (where.outletAccountId) query = query.where('outletAccountId', '=', where.outletAccountId);
  const order = await query.executeTakeFirst();
  if (!order) return null;
  const items = await db
    .selectFrom('outletOrderItems')
    .selectAll()
    .where('orderId', '=', order.id)
    .orderBy('lineNo')
    .execute();
  return {
    id: order.id,
    number: order.number,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    paymentStatus: order.paymentStatus,
    items: items.map((item) => ({
      packageId: item.packageId,
      nameSnapshot: item.nameSnapshot,
      contentsSnapshot: item.contentsSnapshot,
      unitPriceRupiah: item.unitPriceRupiah,
      qty: item.qty,
      lineTotalRupiah: item.lineTotalRupiah,
    })),
    totalRupiah: order.totalRupiah,
  };
}

/** Order milik outlet ini saja. Order outlet lain dijawab tidak ada (404), bukan 403. */
export function getOwnOrder(db: Db, outletAccountId: string, id: string) {
  return loadOrder(db, { id, outletAccountId });
}

export async function listOwnOrders(db: Db, outletAccountId: string): Promise<OutletOrder[]> {
  const ids = await db
    .selectFrom('outletOrders')
    .select('id')
    .where('outletAccountId', '=', outletAccountId)
    .orderBy('createdAt', 'desc')
    .limit(100)
    .execute();
  const orders = await Promise.all(ids.map((row) => loadOrder(db, { id: row.id })));
  return orders.filter((order): order is OutletOrder => order !== null);
}

async function findByIdempotencyKey(
  db: Db | Transaction<Database>,
  outletAccountId: string,
  key: string,
) {
  return db
    .selectFrom('outletOrders')
    .select(['id', 'quoteId'])
    .where('outletAccountId', '=', outletAccountId)
    .where('idempotencyKey', '=', key)
    .executeTakeFirst();
}

export type CreateOrderResult = { order: OutletOrder; replayed: boolean };

/**
 * Buat order dari quote. Satu Idempotency-Key menghasilkan satu order: kiriman ulang dengan
 * key yang sama mengembalikan order yang sama (US-06). Quote dikunci FOR UPDATE supaya dua
 * kiriman bersamaan tidak membuat dua order; unique key di DB menjadi pengaman terakhir.
 */
export async function createOrder(
  db: Db,
  actor: Actor,
  outletAccountId: string,
  quoteId: string,
  idempotencyKey: string,
  requestId: string,
): Promise<CreateOrderResult> {
  const replay = async (): Promise<CreateOrderResult | null> => {
    const existing = await findByIdempotencyKey(db, outletAccountId, idempotencyKey);
    if (!existing) return null;
    if (existing.quoteId !== quoteId) {
      throw conflict('Idempotency-Key ini sudah dipakai untuk order lain.');
    }
    const order = await loadOrder(db, { id: existing.id });
    if (!order) throw new Error('Order hasil idempotensi tidak ditemukan.');
    return { order, replayed: true };
  };

  const earlier = await replay();
  if (earlier) return earlier;

  try {
    const outcome = await db.transaction().execute(async (trx) => {
      const quote = await trx
        .selectFrom('outletQuotes')
        .selectAll()
        .where('id', '=', quoteId)
        .where('outletAccountId', '=', outletAccountId)
        .forUpdate()
        .executeTakeFirst();
      if (!quote) throw notFound('Quote tidak ditemukan.');

      // Diperiksa lagi setelah lock: kiriman kembar yang menunggu lock harus mendapat order
      // pemenang, bukan pesan "quote sudah dipakai" (US-06).
      const sameKey = await findByIdempotencyKey(trx, outletAccountId, idempotencyKey);
      if (sameKey) {
        if (sameKey.quoteId !== quoteId)
          throw conflict('Idempotency-Key ini sudah dipakai untuk order lain.');
        return { id: sameKey.id, replayed: true };
      }

      const used = await trx
        .selectFrom('outletOrders')
        .select('id')
        .where('quoteId', '=', quoteId)
        .executeTakeFirst();
      if (used) throw conflict('Quote ini sudah dipakai untuk order lain. Minta quote baru.');
      if (quote.expiresAt.getTime() <= Date.now()) {
        throw conflict(
          'Quote sudah kedaluwarsa. Minta quote baru untuk melihat harga terkini.',
          'QUOTE_EXPIRED',
        );
      }

      // Harga atau status paket berubah sejak quote dibuat: pelanggan harus menyetujui quote baru.
      const lines = quote.items;
      const current = await trx
        .selectFrom('outletPackages')
        .select(['id', 'unitPriceRupiah', 'priceVersion', 'status'])
        .where(
          'id',
          'in',
          lines.map((line) => line.packageId),
        )
        .forShare()
        .execute();
      const currentById = new Map(current.map((pkg) => [pkg.id, pkg]));
      const changed = lines.some((line) => {
        const pkg = currentById.get(line.packageId);
        return (
          !pkg ||
          pkg.status !== 'published' ||
          pkg.priceVersion !== line.priceVersion ||
          pkg.unitPriceRupiah !== line.unitPriceRupiah
        );
      });
      if (changed) {
        throw conflict(
          'Harga atau ketersediaan paket berubah. Periksa quote baru sebelum mengajukan order.',
          'QUOTE_CHANGED',
        );
      }

      const id = newId();
      await trx
        .insertInto('outletOrders')
        .values({
          id,
          number: referenceNumber('ORD'),
          outletAccountId,
          quoteId,
          idempotencyKey,
          status: 'diajukan',
          paymentStatus: 'belum_ditagih',
          totalRupiah: quote.totalRupiah,
        })
        .execute();
      await trx
        .insertInto('outletOrderItems')
        .values(
          lines.map((line, index) => ({
            orderId: id,
            lineNo: index + 1,
            packageId: line.packageId,
            nameSnapshot: line.nameSnapshot,
            contentsSnapshot: line.contentsSnapshot,
            unitPriceRupiah: line.unitPriceRupiah,
            priceVersion: line.priceVersion,
            qty: line.qty,
            lineTotalRupiah: line.lineTotalRupiah,
          })),
        )
        .execute();
      await trx
        .insertInto('outletOrderEvents')
        .values({
          orderId: id,
          fromStatus: null,
          toStatus: 'diajukan',
          actorRealm: actor.realm,
          actorId: actor.id,
          reason: null,
        })
        .execute();
      await audit(trx, {
        actor,
        action: 'order.create',
        objectType: 'outlet_order',
        objectId: id,
        objectLabel: `Order ${quote.totalRupiah} rupiah`,
        requestId,
      });
      return { id, replayed: false };
    });
    const order = await loadOrder(db, { id: outcome.id });
    if (!order) throw new Error('Order tidak terbaca setelah transaksi.');
    return { order, replayed: outcome.replayed };
  } catch (error) {
    // Kiriman kembar yang lolos bersamaan: salah satunya kena unique key. Kembalikan order pemenang.
    if (isDuplicateKey(error)) {
      const winner = await replay();
      if (winner) return winner;
      throw conflict('Quote ini sudah dipakai untuk order lain. Minta quote baru.');
    }
    throw error;
  }
}

/**
 * Ubah status order oleh Admin. Hanya transisi yang ada di ORDER_TRANSITIONS; alasan wajib
 * untuk Ditolak/Dibatalkan; actor dan alasan tercatat (US-07). Order tidak pernah dihapus.
 */
export async function changeOrderStatus(
  db: Db,
  actor: Actor,
  orderId: string,
  to: OrderStatus,
  reason: string | null,
  requestId: string,
): Promise<OutletOrder> {
  const note = reason?.trim() || null;
  if (ORDER_STATUS_NEEDS_REASON.includes(to) && !note) {
    throw invalid('Alasan wajib diisi untuk status ini.', { reason: 'Alasan wajib diisi.' });
  }
  await db.transaction().execute(async (trx) => {
    const order = await trx
      .selectFrom('outletOrders')
      .select(['id', 'number', 'status'])
      .where('id', '=', orderId)
      .forUpdate()
      .executeTakeFirst();
    if (!order) throw notFound('Order tidak ditemukan.');
    if (!canTransition(order.status, to)) {
      throw new HttpError(
        409,
        'INVALID_TRANSITION',
        `Status order tidak bisa diubah dari ${order.status} ke ${to}.`,
      );
    }
    await trx.updateTable('outletOrders').set({ status: to }).where('id', '=', orderId).execute();
    await trx
      .insertInto('outletOrderEvents')
      .values({
        orderId,
        fromStatus: order.status,
        toStatus: to,
        actorRealm: actor.realm,
        actorId: actor.id,
        reason: note,
      })
      .execute();
    await audit(trx, {
      actor,
      action: `order.status.${to}`,
      objectType: 'outlet_order',
      objectId: orderId,
      objectLabel: order.number,
      requestId,
    });
  });
  const order = await loadOrder(db, { id: orderId });
  if (!order) throw notFound('Order tidak ditemukan.');
  return order;
}
