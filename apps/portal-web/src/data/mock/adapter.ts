import type { DataEnvelope, StaffSession } from '@agrabudi/contracts';
import { routeAccess } from '../../auth/access';
import { findModuleRoute } from '../../registry';
import { ForbiddenError, type PortalDataAdapter } from '../adapter';
import type { DataRow, ModuleDataset } from '../types';
import { datasetRegistry, type DatasetSpec } from './datasets';
import { people, personByUsername, teams, type Person } from './org';

/**
 * Adapter contoh untuk modul Portal. Data hidup di memori selama halaman terbuka;
 * tambah, ubah, hapus, dan unggah tidak dikirim ke mana pun.
 *
 * Cakupan dan izin diperiksa di sini juga, meniru pemeriksaan server. Ini tidak
 * menggantikan kontrol akses sungguhan di backend (PRD 4.13).
 */
const store = new Map<string, { spec: DatasetSpec; rows: DataRow[] }>();

/** Beberapa menu memakai dataset yang sama, mis. Database Pelanggan dan Input Order. */
const sharedKey: Record<string, string> = {
  '/admin/indihome/database-pelanggan': '/indihome/pelanggan/database',
  '/admin/indihome/input-order': '/indihome/pelanggan/input-order',
  '/admin/indihome/status': '/indihome/performance/io-re-ps',
  '/admin/admin-input/outlet': '/telkomsel/outlet/register-outlet',
};

function entry(path: string) {
  const key = sharedKey[path] ?? path;
  let found = store.get(key);
  if (!found) {
    const build = datasetRegistry[key];
    if (!build) return null;
    const spec = build();
    found = { spec, rows: spec.rows };
    store.set(key, found);
  }
  return found;
}

function me(session: StaffSession): Person | undefined {
  return personByUsername(session.username);
}

/** Tim yang dipegang supervisor ini. */
function supervisedTeams(person: Person | undefined): string[] {
  if (!person) return [];
  return teams.filter((team) => team.supervisorId === person.id).map((team) => team.id);
}

function inScope(row: DataRow, session: StaffSession): boolean {
  // Data rujukan tingkat cluster (tanpa pemilik) terlihat oleh semua yang boleh membuka menunya.
  if (row.ownerId === null) return true;
  const person = me(session);
  switch (session.scope) {
    case 'cluster':
      return true;
    case 'team':
      return row.teamId !== null && supervisedTeams(person).includes(row.teamId);
    case 'self':
      return row.ownerId === person?.id;
    case 'site':
      return false;
  }
}

function peopleOptions(spec: DatasetSpec, session: StaffSession) {
  const units = spec.personUnits ?? [];
  const person = me(session);
  return people
    .filter((candidate) => candidate.role === 'salesforce' && candidate.unit !== null && units.includes(candidate.unit))
    .filter((candidate) => {
      if (session.scope === 'self') return candidate.id === person?.id;
      if (session.scope === 'team') return candidate.teamId !== null && supervisedTeams(person).includes(candidate.teamId);
      return true;
    })
    .map((candidate) => ({ id: candidate.id, name: candidate.name }));
}

function access(path: string, session: StaffSession) {
  const route = findModuleRoute(path);
  return route ? routeAccess(session, route) : null;
}

/** Hitung ulang kolom turunan setelah data diubah, supaya angka tetap konsisten. */
function recompute(cells: DataRow['cells']) {
  const num = (key: string) => (typeof cells[key] === 'number' ? (cells[key] as number) : null);
  const target = num('target');
  const real = num('realisasi');
  if (target !== null && real !== null && 'capaian' in cells) {
    const ach = target > 0 ? Math.round((real / target) * 1000) / 10 : 0;
    cells.capaian = ach;
    if ('status' in cells && (cells.status === 'Tercapai' || cells.status === 'Belum tercapai')) {
      cells.status = ach >= 100 ? 'Tercapai' : 'Belum tercapai';
    }
  }
  const start = num('awal');
  const incoming = num('masuk');
  const sold = num('terjual');
  if (start !== null && incoming !== null && sold !== null && 'sisa' in cells) {
    cells.sisa = start + incoming - sold;
  }
  const capital = num('modal');
  const selling = num('jual');
  const cashback = num('cashback');
  if (capital !== null && selling !== null && cashback !== null && 'untung' in cells) {
    cells.untung = selling - capital + cashback;
  }
  const stock = num('stok');
  const allocated = num('teralokasi');
  if (stock !== null && allocated !== null && 'sisa' in cells) cells.sisa = stock - allocated;
}

function asMock<T>(data: T): DataEnvelope<T> {
  return {
    data,
    meta: {
      source: 'mock',
      asOf: new Date().toISOString(),
      note: 'Data contoh untuk mencoba Portal. Bukan data resmi.',
    },
  };
}

export const mockPortalAdapter: PortalDataAdapter = {
  getDataset: async (path, session) => {
    const mode = access(path, session);
    if (!mode) throw new ForbiddenError();
    const found = entry(path);
    if (!found) return asMock(null);
    const { spec } = found;
    const rows = found.rows.filter((item) => inScope(item, session));
    const dataset: ModuleDataset = {
      description: spec.description,
      columns: spec.columns,
      rows,
      stats: spec.stats ? spec.stats(rows) : [],
      chart: spec.chart ? spec.chart(rows) : null,
      filters: spec.filters ?? [],
      editable: Boolean(spec.editable) && mode === 'manage',
      ownerCreate: Boolean(spec.ownerCreate) && mode === 'view',
      upload: spec.upload && mode === 'manage' ? spec.upload : null,
      people: peopleOptions(spec, session),
    };
    return asMock(dataset);
  },

  saveRow: async (path, input, session) => {
    const mode = access(path, session);
    const found = entry(path);
    if (!mode || !found) throw new ForbiddenError();
    const person = me(session);
    const existing = input.id ? found.rows.find((item) => item.id === input.id) : undefined;
    const manage = mode === 'manage' && Boolean(found.spec.editable);
    const ownCreate = mode === 'view' && Boolean(found.spec.ownerCreate) && !existing;
    if (!manage && !ownCreate) throw new ForbiddenError();
    if (existing && !inScope(existing, session)) throw new ForbiddenError();

    // Pemilik baris: yang dipilih di kolom Salesforce bila diizinkan cakupan, selain itu diri sendiri.
    const allowedOwners = new Set(peopleOptions(found.spec, session).map((item) => item.id));
    let ownerId: string | null = existing?.ownerId ?? null;
    if (input.ownerId && allowedOwners.has(input.ownerId)) ownerId = input.ownerId;
    else if (ownCreate) ownerId = person?.id ?? null;
    const owner = people.find((item) => item.id === ownerId);

    const cells = { ...(existing?.cells ?? {}), ...input.cells };
    if (owner && 'salesforce' in cells) cells.salesforce = owner.name;
    recompute(cells);

    const next: DataRow = {
      id: existing?.id ?? `baru-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      ownerId,
      teamId: owner?.teamId ?? existing?.teamId ?? null,
      cells,
    };
    found.rows = existing
      ? found.rows.map((item) => (item.id === existing.id ? next : item))
      : [next, ...found.rows];
  },

  deleteRow: async (path, rowId, session) => {
    const mode = access(path, session);
    const found = entry(path);
    if (mode !== 'manage' || !found?.spec.editable) throw new ForbiddenError();
    const target = found.rows.find((item) => item.id === rowId);
    if (!target || !inScope(target, session)) throw new ForbiddenError();
    found.rows = found.rows.filter((item) => item.id !== rowId);
  },

  importRows: async (path, fileName, rows, rejected, session) => {
    const mode = access(path, session);
    const found = entry(path);
    if (mode !== 'manage' || !found?.spec.upload) throw new ForbiddenError();
    const today = new Date().toISOString().slice(0, 10);
    const record: DataRow = {
      id: `unggah-${Date.now()}`,
      ownerId: null,
      teamId: null,
      cells: {
        tanggal: today,
        berkas: fileName,
        diterima: rows.length,
        ditolak: rejected,
        oleh: me(session)?.name ?? session.displayName,
        status: rejected > 0 ? 'Sebagian ditolak' : 'Berhasil',
      },
    };
    found.rows = [record, ...found.rows];
    return { accepted: rows.length, rejected };
  },
};
