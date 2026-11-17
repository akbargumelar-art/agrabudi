import { cuanProfit } from '@agrabudi/contracts';
import { notFound } from '../../lib/errors';
import { newId } from '../../lib/ids';
import { YES_NO, count, row, type PortalModule } from '../types';

/**
 * Produk Kalkulator Cuan. Untung per unit memakai `cuanProfit` dari kontrak (rumus modul cuan
 * repo landing); angka ini simulasi, rumus final menunggu pengesahan (PRD D-07).
 */
export const cuanProductsModule: PortalModule = {
  path: '/admin/admin-input/kalkulator-cuan',
  description:
    'Produk, harga modal, harga jual, dan cashback untuk Kalkulator Cuan di aplikasi Outlet.',
  canCreate: true,
  canDelete: true,
  filters: ['kategori', 'brand', 'aktif'],
  columns: () => [
    { key: 'produk', label: 'Produk', kind: 'text', editable: true, required: true },
    { key: 'kategori', label: 'Kategori', kind: 'text', editable: true, required: true },
    { key: 'brand', label: 'Brand', kind: 'text', editable: true, required: true },
    { key: 'modal', label: 'Harga modal', kind: 'rupiah', editable: true, required: true },
    { key: 'jual', label: 'Harga jual', kind: 'rupiah', editable: true, required: true },
    { key: 'cashback', label: 'Cashback', kind: 'rupiah', editable: true, required: true },
    { key: 'untung', label: 'Untung per unit', kind: 'rupiah' },
    {
      key: 'unggulan',
      label: 'Unggulan',
      kind: 'status',
      editable: true,
      required: true,
      options: Object.values(YES_NO),
    },
    {
      key: 'aktif',
      label: 'Aktif',
      kind: 'status',
      editable: true,
      required: true,
      options: Object.values(YES_NO),
    },
  ],
  async list({ db }) {
    const rows = await db
      .selectFrom('cuanProducts')
      .selectAll()
      .orderBy('categoryName')
      .orderBy('name')
      .execute();
    return rows.map((item) =>
      row(item.id, {
        produk: item.name,
        kategori: item.categoryName,
        brand: item.brandName,
        modal: item.capitalPrice,
        jual: item.sellingPrice,
        cashback: item.cashback,
        untung: cuanProfit(item),
        unggulan: item.isHot ? YES_NO.yes : YES_NO.no,
        aktif: item.active ? YES_NO.yes : YES_NO.no,
      }),
    );
  },
  async save({ db }, id, cells) {
    const values = {
      name: cells.text('produk', 120),
      categoryName: cells.text('kategori', 60),
      brandName: cells.text('brand', 60),
      capitalPrice: cells.int('modal'),
      sellingPrice: cells.int('jual'),
      cashback: cells.int('cashback'),
      isHot: cells.option('unggulan', YES_NO) === 'yes',
      active: cells.option('aktif', YES_NO) === 'yes',
    };
    cells.done();
    if (id) {
      const result = await db
        .updateTable('cuanProducts')
        .set(values)
        .where('id', '=', id)
        .executeTakeFirst();
      if (result.numUpdatedRows === 0n) throw notFound('Produk tidak ditemukan.');
      return id;
    }
    const created = newId();
    await db
      .insertInto('cuanProducts')
      .values({ id: created, ...values })
      .execute();
    return created;
  },
  async remove({ db }, id) {
    await db.deleteFrom('cuanProducts').where('id', '=', id).execute();
  },
  stats: (rows) => [
    {
      label: 'Produk aktif',
      value: count(rows.filter((item) => item.cells.aktif === 'Ya').length),
    },
    { label: 'Unggulan', value: count(rows.filter((item) => item.cells.unggulan === 'Ya').length) },
  ],
};
