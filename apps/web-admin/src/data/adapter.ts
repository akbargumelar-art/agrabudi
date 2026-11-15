import type { DataEnvelope, PublicationRecord, SiteBanner, SitePage } from '@agrabudi/contracts';

/**
 * Pintu data console Administrator Web. Hanya konten institusional:
 * tidak ada akses ke produk, harga, order, lamaran, atau fee (PRD 2.4).
 */
export interface WebAdminDataAdapter {
  listPages(): Promise<DataEnvelope<SitePage[]>>;
  listBanners(): Promise<DataEnvelope<SiteBanner[]>>;
  listPublications(): Promise<DataEnvelope<PublicationRecord[]>>;
}

export class DataUnavailableError extends Error {
  readonly code = 'DATA_SOURCE_NOT_CONNECTED';
  constructor(message: string) {
    super(message);
    this.name = 'DataUnavailableError';
  }
}
