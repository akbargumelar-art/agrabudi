import type { DataEnvelope, OutletOrder, OutletQuote } from '@agrabudi/contracts';
import { checkQty } from '../../features/abkshop/cart-math';
import { DataUnavailableError, type OutletDataAdapter } from '../adapter';
import { mockCuanContact, mockCuanProducts } from '@agrabudi/ui/mock-cuan';
import {
  mockCatalog,
  mockHandovers,
  mockOrdersByOutlet,
  mockOutletProfiles,
  mockPrograms,
} from './fixtures';

/** Setiap respons mock membawa `source: "mock"` supaya UI wajib melabelinya. */
function asMock<T>(data: T): DataEnvelope<T> {
  return {
    data,
    meta: {
      source: 'mock',
      asOf: new Date().toISOString(),
      note: 'Data contoh untuk mencoba aplikasi Outlet. Bukan data resmi.',
    },
  };
}

/** Quote dan order contoh hidup di memori selama halaman terbuka; tidak dikirim ke mana pun. */
const mockQuotes = new Map<string, OutletQuote>();
const mockOrderByKey = new Map<string, OutletOrder>();

export const mockAdapter: OutletDataAdapter = {
  getCatalog: async () => asMock(mockCatalog),
  listOrders: async (digiposId) => asMock(mockOrdersByOutlet[digiposId] ?? []),
  getOrder: async (digiposId, id) =>
    asMock((mockOrdersByOutlet[digiposId] ?? []).find((order) => order.id === id) ?? null),
  createQuote: async (_digiposId, request) => {
    const items = request.items.map((item) => {
      const pkg = mockCatalog.packages.find((candidate) => candidate.id === item.packageId);
      const check = pkg ? checkQty(String(item.qty), pkg) : null;
      if (!pkg || !check?.valid)
        throw new DataUnavailableError('Ada paket atau jumlah yang belum sesuai aturan.');
      return {
        packageId: pkg.id,
        nameSnapshot: pkg.name,
        contentsSnapshot: pkg.contents,
        unitPriceRupiah: pkg.unitPriceRupiah,
        qty: item.qty,
        lineTotalRupiah: pkg.unitPriceRupiah * item.qty,
      };
    });
    const now = new Date();
    const quote: OutletQuote = {
      id: `contoh-quote-${now.getTime()}`,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 15 * 60_000).toISOString(),
      items,
      totalRupiah: items.reduce((sum, item) => sum + item.lineTotalRupiah, 0),
    };
    mockQuotes.set(quote.id, quote);
    return asMock(quote);
  },
  createOrder: async (digiposId, quoteId, idempotencyKey) => {
    const replay = mockOrderByKey.get(idempotencyKey);
    if (replay) return asMock(replay);
    const quote = mockQuotes.get(quoteId);
    if (!quote)
      throw new DataUnavailableError('Quote contoh tidak ditemukan. Minta harga final lagi.');
    const order: OutletOrder = {
      id: `contoh-order-${Date.now()}`,
      number: `CONTOH-${String(Date.now()).slice(-6)}`,
      createdAt: new Date().toISOString(),
      status: 'diajukan',
      paymentStatus: 'belum_ditagih',
      items: quote.items,
      totalRupiah: quote.totalRupiah,
    };
    mockQuotes.delete(quoteId);
    mockOrderByKey.set(idempotencyKey, order);
    mockOrdersByOutlet[digiposId] = [order, ...(mockOrdersByOutlet[digiposId] ?? [])];
    return asMock(order);
  },
  listPrograms: async () => asMock(mockPrograms),
  getProgram: async (slug) => asMock(mockPrograms.find((program) => program.slug === slug) ?? null),
  listRewardHandovers: async () => asMock(mockHandovers),
  getOutletProfile: async (digiposId) =>
    asMock(mockOutletProfiles.find((profile) => profile.digiposId === digiposId) ?? null),
  listCuanProducts: async () => asMock(mockCuanProducts),
  getCuanContact: async () => asMock(mockCuanContact),
};
