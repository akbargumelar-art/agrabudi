import { notFound } from '../../lib/errors';
import { newId } from '../../lib/ids';
import { updateSubmission } from './career';
import {
  PACKAGE_STATUS_LABEL,
  SUBMISSION_STATUS_LABEL,
  count,
  dateOf,
  row,
  type PortalModule,
} from '../types';

/** Paket IndiHome di website Publik. Milik Admin unit IndiHome (PRD 2.4). */
export const indihomePackagesModule: PortalModule = {
  path: '/admin/indihome/paket-layanan',
  description:
    'Paket IndiHome yang tampil di website Publik. Harga kosong berarti belum diterbitkan.',
  canCreate: true,
  canDelete: true,
  filters: ['status'],
  columns: () => [
    { key: 'paket', label: 'Paket', kind: 'text', editable: true, required: true },
    { key: 'ringkasan', label: 'Ringkasan', kind: 'longtext', editable: true },
    { key: 'harga', label: 'Harga per bulan', kind: 'rupiah', editable: true },
    { key: 'isi', label: 'Isi paket (satu per baris)', kind: 'longtext', editable: true },
    { key: 'urutan', label: 'Urutan tampil', kind: 'number', editable: true, required: true },
    {
      key: 'status',
      label: 'Status',
      kind: 'status',
      editable: true,
      required: true,
      options: Object.values(PACKAGE_STATUS_LABEL),
    },
  ],
  async list({ db }) {
    const rows = await db
      .selectFrom('indihomePackages')
      .selectAll()
      .orderBy('sortOrder')
      .orderBy('name')
      .execute();
    return rows.map((item) =>
      row(item.id, {
        paket: item.name,
        ringkasan: item.summary,
        harga: item.monthlyPriceRupiah,
        isi: item.features.join('\n'),
        urutan: item.sortOrder,
        status: PACKAGE_STATUS_LABEL[item.status],
      }),
    );
  },
  async save({ db }, id, cells) {
    const values = {
      name: cells.text('paket', 120),
      summary: cells.optionalText('ringkasan', 500) ?? '',
      monthlyPriceRupiah: cells.optionalInt('harga'),
      features: JSON.stringify(cells.lines('isi')),
      sortOrder: cells.int('urutan', { max: 9999 }),
      status: cells.option('status', PACKAGE_STATUS_LABEL),
    };
    cells.done();
    if (id) {
      const result = await db
        .updateTable('indihomePackages')
        .set(values)
        .where('id', '=', id)
        .executeTakeFirst();
      if (result.numUpdatedRows === 0n) throw notFound('Paket tidak ditemukan.');
      return id;
    }
    const created = newId();
    await db
      .insertInto('indihomePackages')
      .values({ id: created, imageUrl: null, ...values })
      .execute();
    return created;
  },
  async remove({ db }, id) {
    await db.deleteFrom('indihomePackages').where('id', '=', id).execute();
  },
};

function submissionModule(options: {
  path: string;
  kind: 'indihome_interest' | 'digipos_registration';
  description: string;
}): PortalModule {
  const digipos = options.kind === 'digipos_registration';
  return {
    path: options.path,
    description: options.description,
    canCreate: false,
    canDelete: false,
    filters: ['status'],
    columns: () => [
      { key: 'referensi', label: 'Referensi', kind: 'id' },
      ...(digipos ? [{ key: 'outlet', label: 'Nama outlet', kind: 'text' as const }] : []),
      { key: 'nama', label: digipos ? 'Pemilik' : 'Nama', kind: 'text' },
      { key: 'hp', label: 'Nomor HP', kind: 'id' },
      { key: 'alamat', label: 'Alamat', kind: 'longtext' },
      { key: 'masuk', label: 'Masuk', kind: 'date' },
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
        .select(['id', 'reference', 'payload', 'createdAt', 'status', 'statusNote'])
        .where('kind', '=', options.kind)
        .orderBy('createdAt', 'desc')
        .limit(500)
        .execute();
      return rows.map((item) =>
        row(item.id, {
          referensi: item.reference,
          ...(digipos ? { outlet: item.payload.outletName ?? '' } : {}),
          nama: item.payload.name ?? '',
          hp: item.payload.phone ?? '',
          alamat: item.payload.address ?? '',
          masuk: dateOf(item.createdAt),
          status: SUBMISSION_STATUS_LABEL[item.status],
          catatan: item.statusNote,
        }),
      );
    },
    save: (ctx, id, cells) => updateSubmission(ctx, id, cells, options.kind),
    stats: (rows) => [
      { label: 'Masuk', value: count(rows.length) },
      {
        label: 'Belum dihubungi',
        value: count(rows.filter((item) => item.cells.status === 'Baru').length),
      },
    ],
  };
}

/** Minat pemasangan IndiHome dari website Publik. Tidak mengklaim coverage atau jadwal otomatis (US-09). */
export const indihomeLeadsModule = submissionModule({
  path: '/admin/indihome/lead',
  kind: 'indihome_interest',
  description:
    'Minat pemasangan dari halaman IndiHome. Petugas menghubungi untuk cek jaringan dan survei.',
});

/** Pendaftaran Digipos dari website Publik. Verifikasi dilakukan petugas, bukan otomatis. */
export const digiposRegistrationsModule = submissionModule({
  path: '/admin/daftar-digipos/pendaftaran',
  kind: 'digipos_registration',
  description:
    'Pendaftaran Digipos dari website Publik. Aktivasi tidak otomatis; petugas memverifikasi.',
});
