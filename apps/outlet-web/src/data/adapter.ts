import type {
  CuanContact,
  CuanProduct,
  DataEnvelope,
  OutletCatalog,
  OutletOrder,
  OutletProfile,
  OutletQuote,
  OutletQuoteRequest,
  Program,
  RewardHandover,
} from '@agrabudi/contracts';

/**
 * Pintu data aplikasi Outlet. Halaman hanya mengenal antarmuka ini, sehingga
 * mock bisa diganti adapter HTTP tanpa mengubah halaman (PRD 4.15 butir 2).
 *
 * Parameter `digiposId` hanya ada di mock. Di produksi server mengambil outlet dari
 * sesi dan tidak pernah mempercayai ID kiriman browser (PRD 4.6).
 */
export interface OutletDataAdapter {
  /** Katalog ABKShop Outlet. Terpisah dari katalog ABKShop Pelanggan, tanpa fallback harga. */
  getCatalog(): Promise<DataEnvelope<OutletCatalog>>;
  /** Pesanan milik outlet yang sedang masuk saja. */
  listOrders(digiposId: string): Promise<DataEnvelope<OutletOrder[]>>;
  /** Pesanan outlet lain dikembalikan sebagai tidak ada, bukan ditampilkan (PRD 4.6, 404). */
  getOrder(digiposId: string, id: string): Promise<DataEnvelope<OutletOrder | null>>;
  /** Minta harga final ke server. Harga dan aturan jumlah dihitung server, bukan browser (PRD 2.7). */
  createQuote(digiposId: string, request: OutletQuoteRequest): Promise<DataEnvelope<OutletQuote>>;
  /**
   * Ajukan order dari quote. Kunci idempotensi yang sama dipakai ulang saat retry supaya
   * tidak tercipta dua order (US-06).
   */
  createOrder(
    digiposId: string,
    quoteId: string,
    idempotencyKey: string,
  ): Promise<DataEnvelope<OutletOrder>>;
  listPrograms(): Promise<DataEnvelope<Program[]>>;
  getProgram(slug: string): Promise<DataEnvelope<Program | null>>;
  /** Dokumentasi penyerahan hadiah program, terbaru lebih dulu. */
  listRewardHandovers(): Promise<DataEnvelope<RewardHandover[]>>;
  /** Profil outlet yang sedang masuk. Di produksi diambil dari sesi, bukan dari parameter. */
  getOutletProfile(digiposId: string): Promise<DataEnvelope<OutletProfile | null>>;
  /** Produk aktif Kalkulator Cuan beserta harga modal, jual, dan cashback. */
  listCuanProducts(): Promise<DataEnvelope<CuanProduct[]>>;
  /** Kontak pendaftaran DigiposAja di Kalkulator Cuan. */
  getCuanContact(): Promise<DataEnvelope<CuanContact>>;
}

export class DataUnavailableError extends Error {
  readonly code = 'DATA_SOURCE_NOT_CONNECTED';
  constructor(message: string) {
    super(message);
    this.name = 'DataUnavailableError';
  }
}
