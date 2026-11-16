import type { DataEnvelope, StaffSession } from '@agrabudi/contracts';
import type { ModuleDataset, RowInput, UploadResult } from './types';

/**
 * Pintu data modul Portal. Cakupan (cluster, tim, diri sendiri) diterapkan di sini, bukan
 * di halaman. Di produksi sesi diambil server dari cookie; parameter `session` di mock hanya
 * meniru itu dan tidak boleh dipercaya sebagai kewenangan (PRD 4.6).
 */
export interface PortalDataAdapter {
  getDataset(path: string, session: StaffSession): Promise<DataEnvelope<ModuleDataset | null>>;
  saveRow(path: string, input: RowInput, session: StaffSession): Promise<void>;
  deleteRow(path: string, rowId: string, session: StaffSession): Promise<void>;
  importRows(
    path: string,
    fileName: string,
    rows: Array<Record<string, string>>,
    rejected: number,
    session: StaffSession,
  ): Promise<UploadResult>;
}

export class DataUnavailableError extends Error {
  readonly code = 'DATA_SOURCE_NOT_CONNECTED';
  constructor(message: string) {
    super(message);
    this.name = 'DataUnavailableError';
  }
}

export class ForbiddenError extends Error {
  readonly code = 'FORBIDDEN';
  constructor(message = 'Akun Anda tidak punya izin untuk aksi ini.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}
