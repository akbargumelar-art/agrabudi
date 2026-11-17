import type { ProgramAudience } from '@agrabudi/contracts';
import { notFound } from '../../lib/errors';
import { newId } from '../../lib/ids';
import { uniqueSlug } from '../slug';
import { CONTENT_STATUS_LABEL, count, row, type PortalModule } from '../types';

/**
 * Promo & Program per audiens. Syarat dan periode milik Admin program, bukan Admin Web
 * (PRD 2.4). Program publik tampil di agrabudi.id/promo, program outlet di Outlet.
 */
function programModule(path: string, audience: ProgramAudience, description: string): PortalModule {
  return {
    path,
    description,
    canCreate: true,
    canDelete: true,
    filters: ['status'],
    columns: () => [
      { key: 'judul', label: 'Program', kind: 'text', editable: true, required: true },
      { key: 'ringkasan', label: 'Ringkasan', kind: 'longtext', editable: true, required: true },
      { key: 'syarat', label: 'Syarat (satu per baris)', kind: 'longtext', editable: true },
      { key: 'mulai', label: 'Mulai', kind: 'date', editable: true, required: true },
      { key: 'selesai', label: 'Selesai', kind: 'date', editable: true, required: true },
      {
        key: 'status',
        label: 'Status',
        kind: 'status',
        editable: true,
        required: true,
        options: Object.values(CONTENT_STATUS_LABEL),
      },
    ],
    async list({ db }) {
      const rows = await db
        .selectFrom('programs')
        .selectAll()
        .where('audience', '=', audience)
        .orderBy('startsAt', 'desc')
        .execute();
      return rows.map((item) =>
        row(item.id, {
          judul: item.title,
          ringkasan: item.summary,
          syarat: item.terms.join('\n'),
          mulai: item.startsAt,
          selesai: item.endsAt,
          status: CONTENT_STATUS_LABEL[item.status],
        }),
      );
    },
    async save({ db }, id, cells) {
      const values = {
        title: cells.text('judul', 160),
        summary: cells.text('ringkasan', 1000),
        terms: JSON.stringify(cells.lines('syarat')),
        startsAt: cells.date('mulai'),
        endsAt: cells.date('selesai'),
        status: cells.option('status', CONTENT_STATUS_LABEL),
      };
      if (values.startsAt && values.endsAt && values.startsAt > values.endsAt) {
        cells.addError('selesai', 'Tanggal selesai tidak boleh sebelum tanggal mulai.');
      }
      cells.done();
      if (id) {
        const result = await db
          .updateTable('programs')
          .set(values)
          .where('id', '=', id)
          .where('audience', '=', audience)
          .executeTakeFirst();
        if (result.numUpdatedRows === 0n) throw notFound('Program tidak ditemukan.');
        return id;
      }
      const created = newId();
      await db
        .insertInto('programs')
        .values({
          id: created,
          slug: await uniqueSlug(db, 'programs', values.title),
          audience,
          imageUrl: null,
          ...values,
        })
        .execute();
      return created;
    },
    async remove({ db }, id) {
      await db
        .deleteFrom('programs')
        .where('id', '=', id)
        .where('audience', '=', audience)
        .execute();
    },
    stats: (rows) => [
      {
        label: 'Program terbit',
        value: count(rows.filter((item) => item.cells.status === 'Terbit').length),
      },
    ],
  };
}

export const customerProgramsModule = programModule(
  '/admin/promo-program/program-pelanggan',
  'public',
  'Program untuk pelanggan, tampil di halaman Promo website Publik.',
);
export const outletProgramsModule = programModule(
  '/admin/promo-program/program-outlet',
  'outlet',
  'Program untuk mitra outlet, tampil di aplikasi Outlet.',
);
export const internalProgramsModule = programModule(
  '/admin/promo-program/program-internal',
  'internal',
  'Program internal. Tidak tampil di Publik maupun Outlet.',
);
