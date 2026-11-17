import { sql } from 'kysely';
import { conflict, notFound } from '../../lib/errors';
import { newId } from '../../lib/ids';
import { uniqueSlug } from '../slug';
import {
  CONTENT_STATUS_LABEL,
  PACKAGE_STATUS_LABEL,
  count,
  row,
  type PortalModule,
} from '../types';

const CUSTOMER_CATEGORY = {
  perdana: 'Perdana',
  voucher: 'Voucher',
  orbit: 'Orbit',
  soundbox: 'Soundbox',
} as const;

/**
 * Katalog ABKShop Pelanggan. Data dan harganya terpisah dari ABKShop Outlet (K-06);
 * harga kosong berarti belum diterbitkan, bukan diambil dari katalog lain.
 */
export const customerProductsModule: PortalModule = {
  path: '/admin/abkshop-pelanggan/produk',
  description:
    'Produk ABKShop Pelanggan di website Publik. Harga kosong berarti belum diterbitkan.',
  canCreate: true,
  canDelete: true,
  filters: ['kategori', 'status'],
  columns: () => [
    { key: 'nama', label: 'Produk', kind: 'text', editable: true, required: true },
    {
      key: 'kategori',
      label: 'Kategori',
      kind: 'status',
      editable: true,
      required: true,
      options: Object.values(CUSTOMER_CATEGORY),
    },
    { key: 'ringkasan', label: 'Ringkasan', kind: 'longtext', editable: true },
    { key: 'ketentuan', label: 'Ketentuan (satu per baris)', kind: 'longtext', editable: true },
    { key: 'harga', label: 'Harga', kind: 'rupiah', editable: true },
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
      .selectFrom('customerProducts')
      .selectAll()
      .orderBy('category')
      .orderBy('name')
      .execute();
    return rows.map((item) =>
      row(item.id, {
        nama: item.name,
        kategori: CUSTOMER_CATEGORY[item.category],
        ringkasan: item.summary,
        ketentuan: item.terms.join('\n'),
        harga: item.priceRupiah,
        status: CONTENT_STATUS_LABEL[item.status],
      }),
    );
  },
  async save({ db }, id, cells) {
    const values = {
      name: cells.text('nama', 120),
      category: cells.option('kategori', CUSTOMER_CATEGORY),
      summary: cells.optionalText('ringkasan', 500) ?? '',
      terms: JSON.stringify(cells.lines('ketentuan')),
      priceRupiah: cells.optionalInt('harga'),
      status: cells.option('status', CONTENT_STATUS_LABEL),
    };
    cells.done();
    if (id) {
      const result = await db
        .updateTable('customerProducts')
        .set(values)
        .where('id', '=', id)
        .executeTakeFirst();
      if (result.numUpdatedRows === 0n) throw notFound('Produk tidak ditemukan.');
      return id;
    }
    const created = newId();
    await db
      .insertInto('customerProducts')
      .values({
        id: created,
        slug: await uniqueSlug(db, 'customerProducts', values.name),
        imageUrl: null,
        ...values,
      })
      .execute();
    return created;
  },
  async remove({ db }, id) {
    await db.deleteFrom('customerProducts').where('id', '=', id).execute();
  },
  stats: (rows) => [
    {
      label: 'Produk terbit',
      value: count(rows.filter((item) => item.cells.status === 'Terbit').length),
    },
    {
      label: 'Belum ada harga',
      value: count(rows.filter((item) => item.cells.harga === null).length),
    },
  ],
};

export const outletCategoriesModule: PortalModule = {
  path: '/admin/abkshop-outlet/kategori',
  description: 'Kategori paket ABKShop Outlet. Kategori yang masih punya paket tidak bisa dihapus.',
  canCreate: true,
  canDelete: true,
  filters: [],
  columns: () => [
    { key: 'kategori', label: 'Kategori', kind: 'text', editable: true, required: true },
    { key: 'urutan', label: 'Urutan tampil', kind: 'number', editable: true, required: true },
    { key: 'paket', label: 'Jumlah paket', kind: 'number' },
  ],
  async list({ db }) {
    const rows = await db
      .selectFrom('outletCategories as c')
      .leftJoin('outletPackages as p', 'p.categoryId', 'c.id')
      .select(['c.id', 'c.name', 'c.sortOrder', sql<number>`COUNT(p.id)`.as('packages')])
      .groupBy('c.id')
      .orderBy('c.sortOrder')
      .orderBy('c.name')
      .execute();
    return rows.map((item) =>
      row(item.id, { kategori: item.name, urutan: item.sortOrder, paket: Number(item.packages) }),
    );
  },
  async save({ db }, id, cells) {
    const values = {
      name: cells.text('kategori', 60),
      sortOrder: cells.int('urutan', { max: 9999 }),
    };
    cells.done();
    const clash = await db
      .selectFrom('outletCategories')
      .select('id')
      .where('name', '=', values.name)
      .executeTakeFirst();
    if (clash && clash.id !== id) throw conflict('Nama kategori sudah dipakai.');
    if (id) {
      const result = await db
        .updateTable('outletCategories')
        .set(values)
        .where('id', '=', id)
        .executeTakeFirst();
      if (result.numUpdatedRows === 0n) throw notFound('Kategori tidak ditemukan.');
      return id;
    }
    const created = newId();
    await db
      .insertInto('outletCategories')
      .values({ id: created, ...values })
      .execute();
    return created;
  },
  async remove({ db }, id) {
    const used = await db
      .selectFrom('outletPackages')
      .select('id')
      .where('categoryId', '=', id)
      .executeTakeFirst();
    if (used)
      throw conflict('Kategori ini masih punya paket. Pindahkan atau arsipkan paketnya dulu.');
    await db.deleteFrom('outletCategories').where('id', '=', id).execute();
  },
};

/**
 * Paket ABKShop Outlet beserta aturan jumlah. Harga berubah = versi harga naik, sehingga
 * quote lama otomatis ditolak dan mitra diminta menyetujui harga baru (US-06).
 * Paket tidak dihapus karena dirujuk order; pakai status Arsip.
 */
export const outletPackagesModule: PortalModule = {
  path: '/admin/abkshop-outlet/paket',
  description:
    'Paket, harga, dan aturan jumlah ABKShop Outlet. Paket lama diarsipkan, tidak dihapus.',
  canCreate: true,
  canDelete: false,
  filters: ['kategori', 'status'],
  async columns({ db }) {
    const categories = await db
      .selectFrom('outletCategories')
      .select('name')
      .orderBy('sortOrder')
      .orderBy('name')
      .execute();
    return [
      { key: 'paket', label: 'Paket', kind: 'text', editable: true, required: true },
      {
        key: 'kategori',
        label: 'Kategori',
        kind: 'status',
        editable: true,
        required: true,
        options: categories.map((item) => item.name),
      },
      { key: 'deskripsi', label: 'Deskripsi', kind: 'longtext', editable: true },
      { key: 'isi', label: 'Isi paket', kind: 'text', editable: true, required: true },
      { key: 'harga', label: 'Harga per paket', kind: 'rupiah', editable: true, required: true },
      { key: 'minimum', label: 'Minimum', kind: 'number', editable: true, required: true },
      { key: 'maksimum', label: 'Maksimum', kind: 'number', editable: true },
      { key: 'kelipatan', label: 'Kelipatan', kind: 'number', editable: true, required: true },
      {
        key: 'status',
        label: 'Status',
        kind: 'status',
        editable: true,
        required: true,
        options: Object.values(PACKAGE_STATUS_LABEL),
      },
    ];
  },
  async list({ db }) {
    const rows = await db
      .selectFrom('outletPackages as p')
      .innerJoin('outletCategories as c', 'c.id', 'p.categoryId')
      .selectAll('p')
      .select('c.name as categoryName')
      .orderBy('c.sortOrder')
      .orderBy('p.name')
      .execute();
    return rows.map((item) =>
      row(item.id, {
        paket: item.name,
        kategori: item.categoryName,
        deskripsi: item.description,
        isi: item.contents,
        harga: item.unitPriceRupiah,
        minimum: item.minQty,
        maksimum: item.maxQty,
        kelipatan: item.multipleOf,
        status: PACKAGE_STATUS_LABEL[item.status],
      }),
    );
  },
  async save({ db }, id, cells) {
    const categoryName = cells.text('kategori', 60);
    const values = {
      name: cells.text('paket', 120),
      description: cells.optionalText('deskripsi', 500) ?? '',
      contents: cells.text('isi', 300),
      unitPriceRupiah: cells.int('harga', { max: 4_000_000_000 }),
      minQty: cells.int('minimum', { min: 1, max: 1_000_000 }),
      maxQty: cells.optionalInt('maksimum', { min: 1, max: 1_000_000 }),
      multipleOf: cells.int('kelipatan', { min: 1, max: 1_000_000 }),
      status: cells.option('status', PACKAGE_STATUS_LABEL),
    };
    if (values.maxQty !== null && values.maxQty < values.minQty) {
      cells.addError('maksimum', 'Maksimum tidak boleh lebih kecil dari minimum.');
    }
    const category = await db
      .selectFrom('outletCategories')
      .select('id')
      .where('name', '=', categoryName)
      .executeTakeFirst();
    if (!category) cells.addError('kategori', 'Kategori tidak ditemukan.');
    cells.done();
    const categoryId = category?.id ?? '';

    if (id) {
      await db.transaction().execute(async (trx) => {
        const current = await trx
          .selectFrom('outletPackages')
          .select(['unitPriceRupiah', 'priceVersion'])
          .where('id', '=', id)
          .forUpdate()
          .executeTakeFirst();
        if (!current) throw notFound('Paket tidak ditemukan.');
        const priceVersion =
          current.unitPriceRupiah === values.unitPriceRupiah
            ? current.priceVersion
            : current.priceVersion + 1;
        await trx
          .updateTable('outletPackages')
          .set({ ...values, categoryId, priceVersion })
          .where('id', '=', id)
          .execute();
      });
      return id;
    }
    const created = newId();
    await db
      .insertInto('outletPackages')
      .values({ id: created, categoryId, thumbnailUrl: null, ...values })
      .execute();
    return created;
  },
  stats: (rows) => [
    {
      label: 'Paket terbit',
      value: count(rows.filter((item) => item.cells.status === 'Terbit').length),
    },
    { label: 'Paket', value: count(rows.length) },
  ],
};
