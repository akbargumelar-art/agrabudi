import type {
  CuanContact,
  CuanProduct,
  DataEnvelope,
  OutletProfile,
  Program,
  RewardHandover,
  SiteSettings,
} from '@agrabudi/contracts';

/**
 * Pintu data aplikasi Outlet. Halaman hanya mengenal antarmuka ini, sehingga
 * mock bisa diganti adapter HTTP tanpa mengubah halaman (PRD 4.15 butir 2).
 *
 * Pemesanan paket tidak lagi dikelola di sini: ABKShop menyematkan halaman
 * pemesanan terpisah, jadi katalog, keranjang, dan pesanan tidak ada di aplikasi ini.
 */
export interface OutletDataAdapter {
  /** Pengaturan dari Admin Web, termasuk alamat halaman ABKShop yang disematkan. */
  getSiteSettings(): Promise<DataEnvelope<SiteSettings>>;
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
