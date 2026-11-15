import type { DataEnvelope, OutletCatalog, OutletOrder, Program } from '@agrabudi/contracts';

/**
 * Pintu data aplikasi Outlet. Halaman hanya mengenal antarmuka ini, sehingga
 * mock bisa diganti adapter HTTP tanpa mengubah halaman (PRD 4.15 butir 2).
 */
export interface OutletDataAdapter {
  getCatalog(): Promise<DataEnvelope<OutletCatalog>>;
  listOrders(): Promise<DataEnvelope<OutletOrder[]>>;
  getOrder(id: string): Promise<DataEnvelope<OutletOrder | null>>;
  listPrograms(): Promise<DataEnvelope<Program[]>>;
  getProgram(slug: string): Promise<DataEnvelope<Program | null>>;
}

export class DataUnavailableError extends Error {
  readonly code = 'DATA_SOURCE_NOT_CONNECTED';
  constructor(message: string) {
    super(message);
    this.name = 'DataUnavailableError';
  }
}
