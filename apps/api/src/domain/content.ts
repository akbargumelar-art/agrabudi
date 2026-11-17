import {
  companyProfileSchema,
  cuanContactSchema,
  digiposInfoSchema,
  indihomeInfoSchema,
  type CuanProduct,
  type CustomerProduct,
  type IndihomePackage,
  type OutletCatalog,
  type OutletPackage,
  type Program,
  type ProgramAudience,
  type RewardHandover,
  type SiteBanner,
  type Vacancy,
} from '@agrabudi/contracts';
import type { Selectable } from 'kysely';
import type { z } from 'zod';
import type { Db } from '../db/database';
import type {
  CuanProductsTable,
  CustomerProductsTable,
  ProgramsTable,
  SiteDocumentKey,
  VacanciesTable,
} from '../db/types';
import { notFound } from '../lib/errors';
import { slugify } from '../lib/ids';
import { todayWib } from '../lib/http';

/**
 * Pembaca konten bisnis untuk Publik dan Outlet. Hanya objek berstatus terbit dan sesuai
 * audiens yang keluar dari sini; draft tidak pernah terlihat (PRD US-03).
 */

export function toCustomerProduct(row: Selectable<CustomerProductsTable>): CustomerProduct {
  return {
    id: row.id,
    slug: row.slug,
    channel: 'customer',
    name: row.name,
    category: row.category,
    summary: row.summary,
    terms: row.terms,
    priceRupiah: row.priceRupiah,
    imageUrl: row.imageUrl,
    status: row.status,
  };
}

export function toProgram(row: Selectable<ProgramsTable>): Program {
  return {
    id: row.id,
    slug: row.slug,
    audience: row.audience,
    title: row.title,
    summary: row.summary,
    terms: row.terms,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    imageUrl: row.imageUrl,
    status: row.status,
  };
}

/** Lowongan yang lewat tanggal tutup dianggap tutup walau statusnya belum diubah Admin. */
export function toVacancy(row: Selectable<VacanciesTable>, today = todayWib()): Vacancy {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    unit: row.unit,
    location: row.location,
    summary: row.summary,
    requirements: row.requirements,
    employmentType: row.employmentType,
    closesAt: row.closesAt,
    status: row.status === 'open' && row.closesAt >= today ? 'open' : 'closed',
  };
}

export function toCuanProduct(row: Selectable<CuanProductsTable>): CuanProduct {
  return {
    id: row.id,
    name: row.name,
    categoryId: slugify(row.categoryName),
    categoryName: row.categoryName,
    brandId: slugify(row.brandName),
    brandName: row.brandName,
    capitalPrice: row.capitalPrice,
    sellingPrice: row.sellingPrice,
    cashback: row.cashback,
    isHot: row.isHot,
  };
}

export async function listCustomerProducts(db: Db): Promise<CustomerProduct[]> {
  const rows = await db
    .selectFrom('customerProducts')
    .selectAll()
    .where('status', '=', 'published')
    .orderBy('category')
    .orderBy('name')
    .execute();
  return rows.map(toCustomerProduct);
}

export async function getCustomerProduct(db: Db, slug: string): Promise<CustomerProduct | null> {
  const row = await db
    .selectFrom('customerProducts')
    .selectAll()
    .where('slug', '=', slug)
    .where('status', '=', 'published')
    .executeTakeFirst();
  return row ? toCustomerProduct(row) : null;
}

/** Daftar program: terbit, untuk audiens ini, dan belum berakhir (WIB). */
export async function listPrograms(db: Db, audience: ProgramAudience): Promise<Program[]> {
  const rows = await db
    .selectFrom('programs')
    .selectAll()
    .where('audience', '=', audience)
    .where('status', '=', 'published')
    .where('endsAt', '>=', todayWib())
    .orderBy('startsAt', 'desc')
    .execute();
  return rows.map(toProgram);
}

/** Detail program terbit tetap bisa dibuka setelah periode berakhir; halaman menampilkan tanggalnya. */
export async function getProgram(
  db: Db,
  audience: ProgramAudience,
  slug: string,
): Promise<Program | null> {
  const row = await db
    .selectFrom('programs')
    .selectAll()
    .where('slug', '=', slug)
    .where('audience', '=', audience)
    .where('status', '=', 'published')
    .executeTakeFirst();
  return row ? toProgram(row) : null;
}

export async function listVacancies(db: Db): Promise<Vacancy[]> {
  const rows = await db
    .selectFrom('vacancies')
    .selectAll()
    .where('status', '!=', 'draft')
    .orderBy('closesAt', 'desc')
    .execute();
  const today = todayWib();
  const vacancies = rows.map((row) => toVacancy(row, today));
  return [
    ...vacancies.filter((item) => item.status === 'open'),
    ...vacancies.filter((item) => item.status === 'closed'),
  ];
}

export async function getVacancy(db: Db, slug: string): Promise<Vacancy | null> {
  const row = await db
    .selectFrom('vacancies')
    .selectAll()
    .where('slug', '=', slug)
    .where('status', '!=', 'draft')
    .executeTakeFirst();
  return row ? toVacancy(row) : null;
}

export async function listIndihomePackages(db: Db): Promise<IndihomePackage[]> {
  const rows = await db
    .selectFrom('indihomePackages')
    .selectAll()
    .where('status', '=', 'published')
    .orderBy('sortOrder')
    .orderBy('name')
    .execute();
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    summary: row.summary,
    monthlyPriceRupiah: row.monthlyPriceRupiah,
    features: row.features,
    imageUrl: row.imageUrl,
  }));
}

/** Banner terbit untuk satu halaman website Publik, dalam periode tayang hari ini (WIB). */
export async function listActiveBanners(db: Db, page: string): Promise<SiteBanner[]> {
  const today = todayWib();
  const rows = await db
    .selectFrom('siteBanners')
    .selectAll()
    .where('site', '=', 'public')
    .where('page', '=', page)
    .where('status', '=', 'published')
    .where('startsAt', '<=', today)
    .where('endsAt', '>=', today)
    .orderBy('slot')
    .orderBy('startsAt', 'desc')
    .execute();
  return rows.map((row) => ({
    id: row.id,
    site: row.site,
    page: row.page,
    slot: row.slot,
    title: row.title,
    subtitle: row.subtitle,
    ctaLabel: row.ctaLabel,
    ctaHref: row.ctaHref,
    imageUrl: row.imageUrl,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    status: row.status,
  }));
}

const DOCUMENT_SCHEMAS = {
  company_profile: companyProfileSchema,
  indihome_info: indihomeInfoSchema,
  digipos_info: digiposInfoSchema,
  cuan_contact: cuanContactSchema,
} as const satisfies Record<SiteDocumentKey, z.ZodType>;

export type DocumentOf<K extends SiteDocumentKey> = z.infer<(typeof DOCUMENT_SCHEMAS)[K]>;

/**
 * Dokumen tunggal (profil perusahaan, info IndiHome/Digipos, kontak Kalkulator Cuan).
 * Belum diisi = 404 dengan pesan jujur; tidak ada isi bawaan atau rekaan.
 */
export async function getDocument<K extends SiteDocumentKey>(
  db: Db,
  key: K,
): Promise<DocumentOf<K>> {
  const row = await db
    .selectFrom('siteDocuments')
    .select('body')
    .where('key', '=', key)
    .executeTakeFirst();
  if (!row) throw notFound('Informasi ini belum diterbitkan.');
  return DOCUMENT_SCHEMAS[key].parse(row.body) as DocumentOf<K>;
}

export function parseDocument<K extends SiteDocumentKey>(key: K, value: unknown): DocumentOf<K> {
  return DOCUMENT_SCHEMAS[key].parse(value) as DocumentOf<K>;
}

export async function putDocument<K extends SiteDocumentKey>(
  db: Db,
  key: K,
  body: DocumentOf<K>,
  actorId: string,
) {
  const json = JSON.stringify(body);
  await db
    .insertInto('siteDocuments')
    .values({ key, body: json, updatedBy: actorId })
    .onDuplicateKeyUpdate({ body: json, updatedBy: actorId })
    .execute();
}

/** Katalog ABKShop Outlet: hanya paket terbit. Tidak pernah membaca katalog pelanggan (K-06). */
export async function getOutletCatalog(db: Db): Promise<OutletCatalog> {
  const [categories, packages] = await Promise.all([
    db
      .selectFrom('outletCategories')
      .select(['id', 'name'])
      .orderBy('sortOrder')
      .orderBy('name')
      .execute(),
    db
      .selectFrom('outletPackages')
      .selectAll()
      .where('status', '=', 'published')
      .orderBy('name')
      .execute(),
  ]);
  return {
    categories,
    packages: packages.map((row): OutletPackage => ({
      id: row.id,
      channel: 'outlet',
      name: row.name,
      description: row.description,
      contents: row.contents,
      categoryId: row.categoryId,
      unitPriceRupiah: row.unitPriceRupiah,
      minQty: row.minQty,
      maxQty: row.maxQty,
      multipleOf: row.multipleOf,
      thumbnailUrl: row.thumbnailUrl,
    })),
  };
}

export async function listRewardHandovers(db: Db): Promise<RewardHandover[]> {
  const rows = await db
    .selectFrom('rewardHandovers')
    .selectAll()
    .where('status', '=', 'published')
    .orderBy('handedOverAt', 'desc')
    .limit(50)
    .execute();
  return rows.map((row) => ({
    id: row.id,
    programTitle: row.programTitle,
    rewardName: row.rewardName,
    outletName: row.outletName,
    tap: row.tap,
    receiverName: row.receiverName,
    handedOverAt: row.handedOverAt,
    photoUrl: row.photoUrl,
  }));
}

export async function listCuanProducts(db: Db): Promise<CuanProduct[]> {
  const rows = await db
    .selectFrom('cuanProducts')
    .selectAll()
    .where('active', '=', true)
    .orderBy('categoryName')
    .orderBy('name')
    .execute();
  return rows.map(toCuanProduct);
}

export function requireFound<T>(value: T | null, message?: string): T {
  if (value === null) throw notFound(message);
  return value;
}
