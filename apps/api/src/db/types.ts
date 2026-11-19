import type { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely';
import type {
  AppId,
  BusinessUnit,
  ContentStatus,
  CustomerCategory,
  DataScope,
  OrderStatus,
  PaymentStatus,
  ProgramAudience,
  PublicFormKind,
  SiteAssetKind,
  StaffPermission,
  StaffRole,
  SubmissionStatus,
} from '@agrabudi/contracts';

/**
 * Tipe tabel MySQL untuk Kysely. Nama kolom ditulis camelCase di sini dan snake_case di
 * database (CamelCasePlugin). Uang = integer rupiah. ID, nomor HP, dan ID Digipos = teks.
 */

/** Kolom JSON: dibaca sebagai objek (mysql2 mengurai JSON), ditulis sebagai teks JSON. */
type Json<T> = ColumnType<T, string, string>;
type CreatedAt = ColumnType<Date, Date | undefined, never>;
type UpdatedAt = ColumnType<Date, Date | undefined, Date | undefined>;
/** Kolom DATE dibaca sebagai teks YYYY-MM-DD (dateStrings) supaya tidak bergeser zona waktu. */
type DateText = string;

export type SessionRealm = 'staff' | 'outlet' | 'web_admin';
export type AccountStatus = 'active' | 'disabled';

export interface StaffAccountsTable {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  role: StaffRole;
  unit: BusinessUnit | null;
  scope: DataScope;
  passwordHash: string;
  status: ColumnType<AccountStatus, AccountStatus | undefined, AccountStatus>;
  createdAt: CreatedAt;
  updatedAt: UpdatedAt;
}

export interface StaffPermissionsTable {
  accountId: string;
  permission: StaffPermission;
}

export interface OutletAccountsTable {
  id: string;
  digiposId: string;
  outletName: string;
  ownerName: string;
  tap: string | null;
  phone: ColumnType<string, string | undefined, string>;
  address: ColumnType<string, string | undefined, string>;
  district: ColumnType<string, string | undefined, string>;
  salesforceName: string | null;
  registeredAt: DateText;
  photoUrl: string | null;
  passwordHash: string;
  status: ColumnType<AccountStatus, AccountStatus | undefined, AccountStatus>;
  createdAt: CreatedAt;
  updatedAt: UpdatedAt;
}

export interface OutletProgramProgressTable {
  id: Generated<number>;
  outletAccountId: string;
  programTitle: string;
  progress: string;
  status: 'berjalan' | 'tercapai' | 'tidak_tercapai';
}

export interface SessionsTable {
  tokenHash: string;
  realm: SessionRealm;
  accountId: string;
  createdAt: CreatedAt;
  lastSeenAt: Date;
  expiresAt: Date;
  idleSeconds: number;
  revokedAt: Date | null;
}

export interface CustomerProductsTable {
  id: string;
  slug: string;
  name: string;
  category: CustomerCategory;
  summary: string;
  terms: Json<string[]>;
  priceRupiah: number | null;
  imageUrl: string | null;
  status: ContentStatus;
  createdAt: CreatedAt;
  updatedAt: UpdatedAt;
}

export interface OutletCategoriesTable {
  id: string;
  name: string;
  sortOrder: number;
}

export type PackageStatus = 'draft' | 'published' | 'archived';

export interface OutletPackagesTable {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  contents: string;
  unitPriceRupiah: number;
  minQty: number;
  maxQty: number | null;
  multipleOf: number;
  thumbnailUrl: string | null;
  status: PackageStatus;
  /** Naik setiap harga berubah. Quote menyimpan versi ini untuk mendeteksi perubahan harga. */
  priceVersion: ColumnType<number, number | undefined, number>;
  createdAt: CreatedAt;
  updatedAt: UpdatedAt;
}

export interface IndihomePackagesTable {
  id: string;
  name: string;
  summary: string;
  monthlyPriceRupiah: number | null;
  features: Json<string[]>;
  imageUrl: string | null;
  status: PackageStatus;
  sortOrder: number;
  createdAt: CreatedAt;
  updatedAt: UpdatedAt;
}

export interface ProgramsTable {
  id: string;
  slug: string;
  audience: ProgramAudience;
  title: string;
  summary: string;
  terms: Json<string[]>;
  startsAt: DateText;
  endsAt: DateText;
  imageUrl: string | null;
  status: ContentStatus;
  createdAt: CreatedAt;
  updatedAt: UpdatedAt;
}

export interface VacanciesTable {
  id: string;
  slug: string;
  title: string;
  unit: string;
  location: string;
  summary: string;
  requirements: Json<string[]>;
  employmentType: string;
  closesAt: DateText;
  /** `draft` tidak tampil di Publik. */
  status: 'draft' | 'open' | 'closed';
  createdAt: CreatedAt;
  updatedAt: UpdatedAt;
}

export interface RewardHandoversTable {
  id: string;
  programTitle: string;
  rewardName: string;
  outletName: string;
  tap: string | null;
  receiverName: string | null;
  handedOverAt: DateText;
  photoUrl: string | null;
  status: 'draft' | 'published';
  createdAt: CreatedAt;
}

export interface CuanProductsTable {
  id: string;
  name: string;
  categoryName: string;
  brandName: string;
  capitalPrice: number;
  sellingPrice: number;
  cashback: number;
  isHot: boolean;
  active: boolean;
  createdAt: CreatedAt;
  updatedAt: UpdatedAt;
}

export type SiteDocumentKey =
  'company_profile' | 'indihome_info' | 'digipos_info' | 'cuan_contact' | 'wa_notifications';

export interface SiteDocumentsTable {
  key: SiteDocumentKey;
  body: Json<unknown>;
  updatedAt: UpdatedAt;
  updatedBy: string | null;
}

export interface QuoteLineJson {
  packageId: string;
  nameSnapshot: string;
  contentsSnapshot: string;
  unitPriceRupiah: number;
  priceVersion: number;
  qty: number;
  lineTotalRupiah: number;
}

export interface OutletQuotesTable {
  id: string;
  outletAccountId: string;
  items: Json<QuoteLineJson[]>;
  totalRupiah: number;
  createdAt: CreatedAt;
  expiresAt: Date;
}

export interface OutletOrdersTable {
  id: string;
  number: string;
  outletAccountId: string;
  quoteId: string;
  idempotencyKey: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalRupiah: number;
  createdAt: CreatedAt;
  updatedAt: UpdatedAt;
}

export interface OutletOrderItemsTable {
  orderId: string;
  lineNo: number;
  packageId: string;
  nameSnapshot: string;
  contentsSnapshot: string;
  unitPriceRupiah: number;
  priceVersion: number;
  qty: number;
  lineTotalRupiah: number;
}

export interface OutletOrderEventsTable {
  id: Generated<number>;
  orderId: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  actorRealm: SessionRealm;
  actorId: string;
  reason: string | null;
  at: CreatedAt;
}

export interface FormSubmissionsTable {
  id: string;
  reference: string;
  kind: PublicFormKind;
  idempotencyKey: string;
  payload: Json<Record<string, string>>;
  vacancyId: string | null;
  cvFileKey: string | null;
  cvFileName: string | null;
  cvMime: string | null;
  cvSizeBytes: number | null;
  status: ColumnType<SubmissionStatus, SubmissionStatus | undefined, SubmissionStatus>;
  statusNote: string | null;
  createdAt: CreatedAt;
  updatedAt: UpdatedAt;
}

export interface SitePagesTable {
  id: string;
  site: AppId;
  slug: string;
  title: string;
  status: ContentStatus;
  revision: ColumnType<number, number | undefined, number>;
  updatedAt: UpdatedAt;
}

export interface SiteBannersTable {
  id: string;
  site: AppId;
  page: string;
  slot: string;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  imageUrl: string | null;
  startsAt: DateText;
  endsAt: DateText;
  status: ContentStatus;
  revision: ColumnType<number, number | undefined, number>;
  updatedAt: UpdatedAt;
}

export interface SiteNavigationTable {
  id: string;
  site: AppId;
  label: string;
  href: string;
  visible: boolean;
  locked: boolean;
  sortOrder: number;
}

export interface SiteLayoutsTable {
  id: string;
  page: string;
  label: string;
  component: string;
  visible: boolean;
  sortOrder: number;
}

export interface SiteAssetsTable {
  id: string;
  name: string;
  kind: SiteAssetKind;
  fileKey: string;
  url: string;
  sizeKb: number;
  uploadedAt: CreatedAt;
  uploadedBy: string;
}

export interface SitePublicationsTable {
  id: string;
  objectType: 'page' | 'banner' | 'navigation' | 'layout';
  objectId: string;
  objectTitle: string;
  revision: number;
  publishedAt: CreatedAt;
  actorId: string;
}

export interface AuditEventsTable {
  id: Generated<number>;
  at: CreatedAt;
  realm: SessionRealm | 'public' | 'system';
  actorId: string | null;
  actorLabel: string;
  action: string;
  objectType: string;
  objectId: string | null;
  objectLabel: string;
  requestId: string | null;
}

export interface Database {
  staffAccounts: StaffAccountsTable;
  staffPermissions: StaffPermissionsTable;
  outletAccounts: OutletAccountsTable;
  outletProgramProgress: OutletProgramProgressTable;
  sessions: SessionsTable;
  customerProducts: CustomerProductsTable;
  outletCategories: OutletCategoriesTable;
  outletPackages: OutletPackagesTable;
  indihomePackages: IndihomePackagesTable;
  programs: ProgramsTable;
  vacancies: VacanciesTable;
  rewardHandovers: RewardHandoversTable;
  cuanProducts: CuanProductsTable;
  siteDocuments: SiteDocumentsTable;
  outletQuotes: OutletQuotesTable;
  outletOrders: OutletOrdersTable;
  outletOrderItems: OutletOrderItemsTable;
  outletOrderEvents: OutletOrderEventsTable;
  formSubmissions: FormSubmissionsTable;
  sitePages: SitePagesTable;
  siteBanners: SiteBannersTable;
  siteNavigation: SiteNavigationTable;
  siteLayouts: SiteLayoutsTable;
  siteAssets: SiteAssetsTable;
  sitePublications: SitePublicationsTable;
  auditEvents: AuditEventsTable;
}

export type StaffAccountRow = Selectable<StaffAccountsTable>;
export type OutletAccountRow = Selectable<OutletAccountsTable>;
export type OutletPackageRow = Selectable<OutletPackagesTable>;
export type NewOutletPackage = Insertable<OutletPackagesTable>;
export type OutletPackageUpdate = Updateable<OutletPackagesTable>;
