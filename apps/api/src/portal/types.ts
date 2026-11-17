import type { Column, DataRow, StatTile } from '@agrabudi/contracts';
import type { Db } from '../db/database';
import type { Actor } from '../lib/audit';
import type { CellReader } from './cells';

export type ModuleCtx = { db: Db; actor: Actor; requestId: string };

/**
 * Modul Portal yang sudah tersambung ke data nyata. Hanya entitas yang punya kontrak di
 * packages/contracts yang dibuat modul; menu lain menunggu kamus data (PRD AS-10).
 */
export type PortalModule = {
  /** Path menu Portal, mis. /admin/kelola-karir/lowongan. */
  path: string;
  description: string;
  canCreate: boolean;
  canDelete: boolean;
  filters: string[];
  columns(ctx: ModuleCtx): Promise<Column[]> | Column[];
  list(ctx: ModuleCtx): Promise<DataRow[]>;
  /** Simpan baris baru (`id` kosong) atau ubah baris lama. Mengembalikan ID baris. */
  save(ctx: ModuleCtx, id: string | undefined, cells: CellReader): Promise<string>;
  remove?(ctx: ModuleCtx, id: string): Promise<void>;
  stats?(rows: DataRow[]): StatTile[];
};

export function row(id: string, cells: DataRow['cells']): DataRow {
  return { id, ownerId: null, teamId: null, cells };
}

export const CONTENT_STATUS_LABEL = {
  draft: 'Draft',
  review: 'Review',
  published: 'Terbit',
  archived: 'Arsip',
} as const;

export const PACKAGE_STATUS_LABEL = {
  draft: 'Draft',
  published: 'Terbit',
  archived: 'Arsip',
} as const;

export const SUBMISSION_STATUS_LABEL = {
  baru: 'Baru',
  dihubungi: 'Dihubungi',
  selesai: 'Selesai',
  ditolak: 'Ditolak',
} as const;

export const YES_NO = { yes: 'Ya', no: 'Tidak' } as const;

export const count = (value: number) => new Intl.NumberFormat('id-ID').format(value);

export const dateOf = (value: Date) =>
  new Date(value.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
