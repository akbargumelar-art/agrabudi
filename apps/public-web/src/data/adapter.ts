import type {
  CustomerProduct,
  DataEnvelope,
  IndihomePackage,
  Program,
  SiteBanner,
  Vacancy,
} from '@agrabudi/contracts';

/**
 * Pintu data website Publik. Hanya konten terbit untuk audiens publik:
 * katalog pelanggan (bukan katalog Outlet), program publik, lowongan, dan banner.
 */
export interface PublicDataAdapter {
  listProducts(): Promise<DataEnvelope<CustomerProduct[]>>;
  getProduct(slug: string): Promise<DataEnvelope<CustomerProduct | null>>;
  listPrograms(): Promise<DataEnvelope<Program[]>>;
  getProgram(slug: string): Promise<DataEnvelope<Program | null>>;
  listVacancies(): Promise<DataEnvelope<Vacancy[]>>;
  getVacancy(slug: string): Promise<DataEnvelope<Vacancy | null>>;
  listIndihomePackages(): Promise<DataEnvelope<IndihomePackage[]>>;
  listBanners(page: string): Promise<DataEnvelope<SiteBanner[]>>;
}

export class DataUnavailableError extends Error {
  readonly code = 'DATA_SOURCE_NOT_CONNECTED';
  constructor(message: string) {
    super(message);
    this.name = 'DataUnavailableError';
  }
}
