import { sql } from 'kysely';
import { conflict, notFound } from '../../lib/errors';
import { newId } from '../../lib/ids';
import { isDuplicateKey } from '../../db/database';
import { uniqueSlug } from '../slug';
import { SUBMISSION_STATUS_LABEL, count, dateOf, row, type PortalModule } from '../types';

const VACANCY_STATUS = { draft: 'Draft', open: 'Dibuka', closed: 'Ditutup' } as const;

/** Lowongan untuk halaman Karir Publik. Izin `career.manage` (PRD 2.4). */
export const vacanciesModule: PortalModule = {
  path: '/admin/kelola-karir/lowongan',
  description: 'Lowongan yang tampil di halaman Karir website Publik. Draft tidak tampil.',
  canCreate: true,
  canDelete: true,
  filters: ['status', 'unit'],
  columns: () => [
    { key: 'judul', label: 'Posisi', kind: 'text', editable: true, required: true },
    { key: 'unit', label: 'Unit', kind: 'text', editable: true, required: true },
    { key: 'lokasi', label: 'Lokasi', kind: 'text', editable: true, required: true },
    { key: 'jenis', label: 'Jenis kerja', kind: 'text', editable: true, required: true },
    { key: 'ditutup', label: 'Ditutup', kind: 'date', editable: true, required: true },
    { key: 'ringkasan', label: 'Ringkasan', kind: 'longtext', editable: true, required: true },
    { key: 'syarat', label: 'Persyaratan (satu per baris)', kind: 'longtext', editable: true },
    { key: 'pelamar', label: 'Pelamar', kind: 'number' },
    {
      key: 'status',
      label: 'Status',
      kind: 'status',
      editable: true,
      required: true,
      options: Object.values(VACANCY_STATUS),
    },
  ],
  async list({ db }) {
    const rows = await db
      .selectFrom('vacancies as v')
      .leftJoin('formSubmissions as f', 'f.vacancyId', 'v.id')
      .select([
        'v.id',
        'v.title',
        'v.unit',
        'v.location',
        'v.employmentType',
        'v.closesAt',
        'v.summary',
        'v.requirements',
        'v.status',
        sql<number>`COUNT(f.id)`.as('applicants'),
      ])
      .groupBy('v.id')
      .orderBy('v.closesAt', 'desc')
      .execute();
    return rows.map((item) =>
      row(item.id, {
        judul: item.title,
        unit: item.unit,
        lokasi: item.location,
        jenis: item.employmentType,
        ditutup: item.closesAt,
        ringkasan: item.summary,
        syarat: item.requirements.join('\n'),
        pelamar: Number(item.applicants),
        status: VACANCY_STATUS[item.status],
      }),
    );
  },
  async save({ db }, id, cells) {
    const values = {
      title: cells.text('judul', 120),
      unit: cells.text('unit', 60),
      location: cells.text('lokasi', 80),
      employmentType: cells.text('jenis', 40),
      closesAt: cells.date('ditutup'),
      summary: cells.text('ringkasan', 2000),
      requirements: JSON.stringify(cells.lines('syarat')),
      status: cells.option('status', VACANCY_STATUS),
    };
    cells.done();
    if (id) {
      const result = await db
        .updateTable('vacancies')
        .set(values)
        .where('id', '=', id)
        .executeTakeFirst();
      if (result.numUpdatedRows === 0n) throw notFound('Lowongan tidak ditemukan.');
      return id;
    }
    const newIdValue = newId();
    await db
      .insertInto('vacancies')
      .values({ id: newIdValue, slug: await uniqueSlug(db, 'vacancies', values.title), ...values })
      .execute();
    return newIdValue;
  },
  async remove({ db }, id) {
    const used = await db
      .selectFrom('formSubmissions')
      .select('id')
      .where('vacancyId', '=', id)
      .executeTakeFirst();
    if (used)
      throw conflict(
        'Lowongan ini sudah punya lamaran. Ubah statusnya menjadi Ditutup, bukan dihapus.',
      );
    await db.deleteFrom('vacancies').where('id', '=', id).execute();
  },
  stats: (rows) => [
    {
      label: 'Lowongan dibuka',
      value: count(rows.filter((item) => item.cells.status === 'Dibuka').length),
    },
    {
      label: 'Total pelamar',
      value: count(rows.reduce((sum, item) => sum + Number(item.cells.pelamar ?? 0), 0)),
    },
  ],
};

/**
 * Lamaran masuk. Hanya Admin dengan izin rekrutmen; CV diunduh lewat endpoint berizin,
 * tidak pernah lewat URL publik (US-08). Lamaran tidak bisa ditambah atau dihapus dari Portal.
 */
export const applicationsModule: PortalModule = {
  path: '/admin/kelola-karir/lamaran',
  description: 'Lamaran dari halaman Karir. CV privat, hanya untuk petugas rekrutmen berizin.',
  canCreate: false,
  canDelete: false,
  filters: ['status', 'posisi'],
  columns: () => [
    { key: 'referensi', label: 'Referensi', kind: 'id' },
    { key: 'pelamar', label: 'Pelamar', kind: 'text' },
    { key: 'posisi', label: 'Posisi', kind: 'text' },
    { key: 'email', label: 'Email', kind: 'text' },
    { key: 'hp', label: 'Nomor HP', kind: 'id' },
    { key: 'masuk', label: 'Masuk', kind: 'date' },
    { key: 'cv', label: 'CV', kind: 'link' },
    {
      key: 'status',
      label: 'Status',
      kind: 'status',
      editable: true,
      required: true,
      options: Object.values(SUBMISSION_STATUS_LABEL),
    },
    { key: 'catatan', label: 'Catatan tindak lanjut', kind: 'longtext', editable: true },
  ],
  async list({ db }) {
    const rows = await db
      .selectFrom('formSubmissions')
      .select(['id', 'reference', 'payload', 'createdAt', 'status', 'statusNote', 'cvFileKey'])
      .where('kind', '=', 'job_application')
      .orderBy('createdAt', 'desc')
      .limit(500)
      .execute();
    return rows.map((item) =>
      row(item.id, {
        referensi: item.reference,
        pelamar: item.payload.name ?? '',
        posisi: item.payload.vacancyTitle ?? '',
        email: item.payload.email ?? '',
        hp: item.payload.phone ?? '',
        masuk: dateOf(item.createdAt),
        cv: item.cvFileKey ? `/api/v1/admin/applications/${item.id}/cv` : null,
        status: SUBMISSION_STATUS_LABEL[item.status],
        catatan: item.statusNote,
      }),
    );
  },
  save: (ctx, id, cells) => updateSubmission(ctx, id, cells, 'job_application'),
  stats: (rows) => [
    { label: 'Lamaran', value: count(rows.length) },
    {
      label: 'Belum ditindaklanjuti',
      value: count(rows.filter((item) => item.cells.status === 'Baru').length),
    },
  ],
};

/** Ubah status tindak lanjut kiriman form. Isi kiriman pelamar/pendaftar tidak bisa diubah. */
export async function updateSubmission(
  { db }: Parameters<PortalModule['save']>[0],
  id: string | undefined,
  cells: Parameters<PortalModule['save']>[2],
  kind: 'job_application' | 'indihome_interest' | 'digipos_registration',
): Promise<string> {
  if (!id)
    throw conflict('Data ini hanya masuk dari form website, tidak bisa ditambah dari Portal.');
  const status = cells.option('status', SUBMISSION_STATUS_LABEL);
  const statusNote = cells.optionalText('catatan', 300);
  cells.done();
  try {
    const result = await db
      .updateTable('formSubmissions')
      .set({ status, statusNote })
      .where('id', '=', id)
      .where('kind', '=', kind)
      .executeTakeFirst();
    if (result.numUpdatedRows === 0n) throw notFound();
  } catch (error) {
    if (isDuplicateKey(error)) throw conflict('Data bentrok dengan data lain.');
    throw error;
  }
  return id;
}
