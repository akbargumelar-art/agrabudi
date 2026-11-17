import { sql, type Kysely } from 'kysely';
import type { Database } from '../types';

/**
 * Skema awal (PRD 4.4, 4.5). InnoDB, utf8mb4, waktu UTC, uang integer rupiah,
 * ID/nomor HP/ID Digipos sebagai teks. CHECK dipakai MySQL 8.0.16+; versi lebih lama
 * mengabaikannya, jadi aturan yang sama juga diperiksa di kode.
 *
 * Satu schema dulu; pemisahan `agrabudi_core`/`agrabudi_site` dengan user DB berbeda
 * (PRD 4.4, 4.10) dilakukan saat CMS API dipisah ke proses sendiri.
 */
const TABLE_OPTIONS = 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
const CONTENT_STATUS = "ENUM('draft','review','published','archived')";
const APP_ID = "ENUM('public','outlet','portal')";
const TIMESTAMPS = `
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`;

const statements = [
  `CREATE TABLE staff_accounts (
    id CHAR(36) NOT NULL,
    username VARCHAR(64) NOT NULL,
    display_name VARCHAR(80) NOT NULL,
    email VARCHAR(120) NULL,
    phone VARCHAR(20) NULL,
    role ENUM('web_admin','admin','manager','supervisor','salesforce') NOT NULL,
    unit ENUM('mobile','household','direct_sales') NULL,
    scope ENUM('site','cluster','team','self') NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status ENUM('active','disabled') NOT NULL DEFAULT 'active',
    ${TIMESTAMPS},
    PRIMARY KEY (id),
    UNIQUE KEY uq_staff_accounts_username (username),
    CONSTRAINT ck_staff_web_admin CHECK (role <> 'web_admin' OR (scope = 'site' AND unit IS NULL)),
    CONSTRAINT ck_staff_site_scope CHECK (scope <> 'site' OR role = 'web_admin')
  ) ${TABLE_OPTIONS}`,

  `CREATE TABLE staff_permissions (
    account_id CHAR(36) NOT NULL,
    permission ENUM('career.manage','user.manage') NOT NULL,
    PRIMARY KEY (account_id, permission),
    CONSTRAINT fk_staff_permissions_account FOREIGN KEY (account_id) REFERENCES staff_accounts (id) ON DELETE CASCADE
  ) ${TABLE_OPTIONS}`,

  `CREATE TABLE outlet_accounts (
    id CHAR(36) NOT NULL,
    digipos_id VARCHAR(32) NOT NULL,
    outlet_name VARCHAR(120) NOT NULL,
    owner_name VARCHAR(80) NOT NULL,
    tap VARCHAR(80) NULL,
    phone VARCHAR(20) NOT NULL DEFAULT '',
    address VARCHAR(300) NOT NULL DEFAULT '',
    district VARCHAR(80) NOT NULL DEFAULT '',
    salesforce_name VARCHAR(80) NULL,
    registered_at DATE NOT NULL,
    photo_url VARCHAR(500) NULL,
    password_hash VARCHAR(255) NOT NULL,
    status ENUM('active','disabled') NOT NULL DEFAULT 'active',
    ${TIMESTAMPS},
    PRIMARY KEY (id),
    UNIQUE KEY uq_outlet_accounts_digipos (digipos_id)
  ) ${TABLE_OPTIONS}`,

  `CREATE TABLE outlet_program_progress (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    outlet_account_id CHAR(36) NOT NULL,
    program_title VARCHAR(160) NOT NULL,
    progress VARCHAR(160) NOT NULL,
    status ENUM('berjalan','tercapai','tidak_tercapai') NOT NULL,
    PRIMARY KEY (id),
    KEY ix_outlet_program_progress_outlet (outlet_account_id),
    CONSTRAINT fk_outlet_program_progress_outlet FOREIGN KEY (outlet_account_id) REFERENCES outlet_accounts (id) ON DELETE CASCADE
  ) ${TABLE_OPTIONS}`,

  `CREATE TABLE sessions (
    token_hash CHAR(64) NOT NULL,
    realm ENUM('staff','outlet','web_admin') NOT NULL,
    account_id CHAR(36) NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    last_seen_at DATETIME(3) NOT NULL,
    expires_at DATETIME(3) NOT NULL,
    idle_seconds INT UNSIGNED NOT NULL,
    revoked_at DATETIME(3) NULL,
    PRIMARY KEY (token_hash),
    KEY ix_sessions_account (realm, account_id),
    KEY ix_sessions_expires (expires_at)
  ) ${TABLE_OPTIONS}`,

  `CREATE TABLE customer_products (
    id CHAR(36) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    name VARCHAR(120) NOT NULL,
    category ENUM('perdana','voucher','orbit','soundbox') NOT NULL,
    summary VARCHAR(500) NOT NULL DEFAULT '',
    terms JSON NOT NULL,
    price_rupiah INT UNSIGNED NULL,
    image_url VARCHAR(500) NULL,
    status ${CONTENT_STATUS} NOT NULL DEFAULT 'draft',
    ${TIMESTAMPS},
    PRIMARY KEY (id),
    UNIQUE KEY uq_customer_products_slug (slug),
    KEY ix_customer_products_status (status, category)
  ) ${TABLE_OPTIONS}`,

  `CREATE TABLE outlet_categories (
    id CHAR(36) NOT NULL,
    name VARCHAR(60) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_outlet_categories_name (name)
  ) ${TABLE_OPTIONS}`,

  `CREATE TABLE outlet_packages (
    id CHAR(36) NOT NULL,
    category_id CHAR(36) NOT NULL,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(500) NOT NULL DEFAULT '',
    contents VARCHAR(300) NOT NULL DEFAULT '',
    unit_price_rupiah INT UNSIGNED NOT NULL,
    min_qty INT UNSIGNED NOT NULL DEFAULT 1,
    max_qty INT UNSIGNED NULL,
    multiple_of INT UNSIGNED NOT NULL DEFAULT 1,
    thumbnail_url VARCHAR(500) NULL,
    status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
    price_version INT UNSIGNED NOT NULL DEFAULT 1,
    ${TIMESTAMPS},
    PRIMARY KEY (id),
    KEY ix_outlet_packages_status (status, category_id),
    CONSTRAINT fk_outlet_packages_category FOREIGN KEY (category_id) REFERENCES outlet_categories (id),
    CONSTRAINT ck_outlet_packages_qty CHECK (min_qty >= 1 AND multiple_of >= 1 AND (max_qty IS NULL OR max_qty >= min_qty))
  ) ${TABLE_OPTIONS}`,

  `CREATE TABLE indihome_packages (
    id CHAR(36) NOT NULL,
    name VARCHAR(120) NOT NULL,
    summary VARCHAR(500) NOT NULL DEFAULT '',
    monthly_price_rupiah INT UNSIGNED NULL,
    features JSON NOT NULL,
    image_url VARCHAR(500) NULL,
    status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
    sort_order INT NOT NULL DEFAULT 0,
    ${TIMESTAMPS},
    PRIMARY KEY (id)
  ) ${TABLE_OPTIONS}`,

  `CREATE TABLE programs (
    id CHAR(36) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    audience ENUM('public','outlet','internal') NOT NULL,
    title VARCHAR(160) NOT NULL,
    summary VARCHAR(1000) NOT NULL DEFAULT '',
    terms JSON NOT NULL,
    starts_at DATE NOT NULL,
    ends_at DATE NOT NULL,
    image_url VARCHAR(500) NULL,
    status ${CONTENT_STATUS} NOT NULL DEFAULT 'draft',
    ${TIMESTAMPS},
    PRIMARY KEY (id),
    UNIQUE KEY uq_programs_slug (slug),
    KEY ix_programs_audience (audience, status, ends_at),
    CONSTRAINT ck_programs_period CHECK (starts_at <= ends_at)
  ) ${TABLE_OPTIONS}`,

  `CREATE TABLE vacancies (
    id CHAR(36) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    title VARCHAR(120) NOT NULL,
    unit VARCHAR(60) NOT NULL,
    location VARCHAR(80) NOT NULL,
    summary VARCHAR(2000) NOT NULL DEFAULT '',
    requirements JSON NOT NULL,
    employment_type VARCHAR(40) NOT NULL,
    closes_at DATE NOT NULL,
    status ENUM('draft','open','closed') NOT NULL DEFAULT 'draft',
    ${TIMESTAMPS},
    PRIMARY KEY (id),
    UNIQUE KEY uq_vacancies_slug (slug),
    KEY ix_vacancies_status (status, closes_at)
  ) ${TABLE_OPTIONS}`,

  `CREATE TABLE reward_handovers (
    id CHAR(36) NOT NULL,
    program_title VARCHAR(160) NOT NULL,
    reward_name VARCHAR(160) NOT NULL,
    outlet_name VARCHAR(120) NOT NULL,
    tap VARCHAR(80) NULL,
    receiver_name VARCHAR(80) NULL,
    handed_over_at DATE NOT NULL,
    photo_url VARCHAR(500) NULL,
    status ENUM('draft','published') NOT NULL DEFAULT 'draft',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY ix_reward_handovers_status (status, handed_over_at)
  ) ${TABLE_OPTIONS}`,

  `CREATE TABLE cuan_products (
    id CHAR(36) NOT NULL,
    name VARCHAR(120) NOT NULL,
    category_name VARCHAR(60) NOT NULL,
    brand_name VARCHAR(60) NOT NULL,
    capital_price INT UNSIGNED NOT NULL,
    selling_price INT UNSIGNED NOT NULL,
    cashback INT UNSIGNED NOT NULL DEFAULT 0,
    is_hot TINYINT(1) NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1,
    ${TIMESTAMPS},
    PRIMARY KEY (id)
  ) ${TABLE_OPTIONS}`,

  `CREATE TABLE site_documents (
    \`key\` ENUM('company_profile','indihome_info','digipos_info','cuan_contact') NOT NULL,
    body JSON NOT NULL,
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    updated_by CHAR(36) NULL,
    PRIMARY KEY (\`key\`)
  ) ${TABLE_OPTIONS}`,

  `CREATE TABLE outlet_quotes (
    id CHAR(36) NOT NULL,
    outlet_account_id CHAR(36) NOT NULL,
    items JSON NOT NULL,
    total_rupiah BIGINT UNSIGNED NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    expires_at DATETIME(3) NOT NULL,
    PRIMARY KEY (id),
    KEY ix_outlet_quotes_outlet (outlet_account_id, created_at),
    CONSTRAINT fk_outlet_quotes_outlet FOREIGN KEY (outlet_account_id) REFERENCES outlet_accounts (id)
  ) ${TABLE_OPTIONS}`,

  `CREATE TABLE outlet_orders (
    id CHAR(36) NOT NULL,
    number VARCHAR(24) NOT NULL,
    outlet_account_id CHAR(36) NOT NULL,
    quote_id CHAR(36) NOT NULL,
    idempotency_key VARCHAR(64) NOT NULL,
    status ENUM('diajukan','dikonfirmasi','diproses','selesai','ditolak','dibatalkan') NOT NULL DEFAULT 'diajukan',
    payment_status ENUM('belum_ditagih','menunggu_pembayaran','dibayar','gagal','kedaluwarsa') NOT NULL DEFAULT 'belum_ditagih',
    total_rupiah BIGINT UNSIGNED NOT NULL,
    ${TIMESTAMPS},
    PRIMARY KEY (id),
    UNIQUE KEY uq_outlet_orders_number (number),
    UNIQUE KEY uq_outlet_orders_quote (quote_id),
    UNIQUE KEY uq_outlet_orders_idempotency (outlet_account_id, idempotency_key),
    KEY ix_outlet_orders_outlet (outlet_account_id, created_at),
    KEY ix_outlet_orders_status (status, created_at),
    CONSTRAINT fk_outlet_orders_outlet FOREIGN KEY (outlet_account_id) REFERENCES outlet_accounts (id),
    CONSTRAINT fk_outlet_orders_quote FOREIGN KEY (quote_id) REFERENCES outlet_quotes (id)
  ) ${TABLE_OPTIONS}`,

  `CREATE TABLE outlet_order_items (
    order_id CHAR(36) NOT NULL,
    line_no SMALLINT UNSIGNED NOT NULL,
    package_id CHAR(36) NOT NULL,
    name_snapshot VARCHAR(120) NOT NULL,
    contents_snapshot VARCHAR(300) NOT NULL,
    unit_price_rupiah INT UNSIGNED NOT NULL,
    price_version INT UNSIGNED NOT NULL,
    qty INT UNSIGNED NOT NULL,
    line_total_rupiah BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (order_id, line_no),
    KEY ix_outlet_order_items_package (package_id),
    CONSTRAINT fk_outlet_order_items_order FOREIGN KEY (order_id) REFERENCES outlet_orders (id),
    CONSTRAINT ck_outlet_order_items_qty CHECK (qty > 0 AND line_total_rupiah = unit_price_rupiah * qty)
  ) ${TABLE_OPTIONS}`,

  `CREATE TABLE outlet_order_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id CHAR(36) NOT NULL,
    from_status ENUM('diajukan','dikonfirmasi','diproses','selesai','ditolak','dibatalkan') NULL,
    to_status ENUM('diajukan','dikonfirmasi','diproses','selesai','ditolak','dibatalkan') NOT NULL,
    actor_realm ENUM('staff','outlet','web_admin') NOT NULL,
    actor_id CHAR(36) NOT NULL,
    reason VARCHAR(300) NULL,
    at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY ix_outlet_order_events_order (order_id, at),
    CONSTRAINT fk_outlet_order_events_order FOREIGN KEY (order_id) REFERENCES outlet_orders (id)
  ) ${TABLE_OPTIONS}`,

  `CREATE TABLE form_submissions (
    id CHAR(36) NOT NULL,
    reference VARCHAR(24) NOT NULL,
    kind ENUM('contact','indihome_interest','digipos_registration','job_application') NOT NULL,
    idempotency_key VARCHAR(64) NOT NULL,
    payload JSON NOT NULL,
    vacancy_id CHAR(36) NULL,
    cv_file_key VARCHAR(200) NULL,
    cv_file_name VARCHAR(200) NULL,
    cv_mime VARCHAR(100) NULL,
    cv_size_bytes INT UNSIGNED NULL,
    status ENUM('baru','dihubungi','selesai','ditolak') NOT NULL DEFAULT 'baru',
    status_note VARCHAR(300) NULL,
    ${TIMESTAMPS},
    PRIMARY KEY (id),
    UNIQUE KEY uq_form_submissions_reference (reference),
    UNIQUE KEY uq_form_submissions_idempotency (kind, idempotency_key),
    KEY ix_form_submissions_kind (kind, created_at),
    CONSTRAINT fk_form_submissions_vacancy FOREIGN KEY (vacancy_id) REFERENCES vacancies (id)
  ) ${TABLE_OPTIONS}`,

  `CREATE TABLE site_pages (
    id CHAR(36) NOT NULL,
    site ${APP_ID} NOT NULL,
    slug VARCHAR(120) NOT NULL,
    title VARCHAR(120) NOT NULL,
    status ${CONTENT_STATUS} NOT NULL DEFAULT 'draft',
    revision INT UNSIGNED NOT NULL DEFAULT 0,
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_site_pages_slug (site, slug)
  ) ${TABLE_OPTIONS}`,

  `CREATE TABLE site_banners (
    id VARCHAR(64) NOT NULL,
    site ${APP_ID} NOT NULL,
    page VARCHAR(60) NOT NULL,
    slot VARCHAR(60) NOT NULL,
    title VARCHAR(120) NOT NULL,
    subtitle VARCHAR(240) NULL,
    cta_label VARCHAR(40) NULL,
    cta_href VARCHAR(300) NULL,
    image_url VARCHAR(500) NULL,
    starts_at DATE NOT NULL,
    ends_at DATE NOT NULL,
    status ${CONTENT_STATUS} NOT NULL DEFAULT 'draft',
    revision INT UNSIGNED NOT NULL DEFAULT 0,
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY ix_site_banners_lookup (site, page, status, starts_at, ends_at),
    CONSTRAINT ck_site_banners_period CHECK (starts_at <= ends_at)
  ) ${TABLE_OPTIONS}`,

  `CREATE TABLE site_navigation (
    id VARCHAR(64) NOT NULL,
    site ${APP_ID} NOT NULL,
    label VARCHAR(60) NOT NULL,
    href VARCHAR(200) NOT NULL,
    visible TINYINT(1) NOT NULL DEFAULT 1,
    locked TINYINT(1) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
  ) ${TABLE_OPTIONS}`,

  `CREATE TABLE site_layouts (
    id VARCHAR(64) NOT NULL,
    page VARCHAR(60) NOT NULL,
    label VARCHAR(80) NOT NULL,
    component VARCHAR(60) NOT NULL,
    visible TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
  ) ${TABLE_OPTIONS}`,

  `CREATE TABLE site_assets (
    id CHAR(36) NOT NULL,
    name VARCHAR(120) NOT NULL,
    kind ENUM('logo','foto','banner','ilustrasi') NOT NULL,
    file_key VARCHAR(200) NOT NULL,
    url VARCHAR(500) NOT NULL,
    size_kb INT UNSIGNED NOT NULL,
    uploaded_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    uploaded_by CHAR(36) NOT NULL,
    PRIMARY KEY (id)
  ) ${TABLE_OPTIONS}`,

  `CREATE TABLE site_publications (
    id CHAR(36) NOT NULL,
    object_type ENUM('page','banner','navigation','layout') NOT NULL,
    object_id VARCHAR(64) NOT NULL,
    object_title VARCHAR(160) NOT NULL,
    revision INT UNSIGNED NOT NULL,
    published_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    actor_id CHAR(36) NOT NULL,
    PRIMARY KEY (id),
    KEY ix_site_publications_at (published_at)
  ) ${TABLE_OPTIONS}`,

  `CREATE TABLE audit_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    realm ENUM('staff','outlet','web_admin','public','system') NOT NULL,
    actor_id CHAR(36) NULL,
    actor_label VARCHAR(80) NOT NULL,
    action VARCHAR(60) NOT NULL,
    object_type VARCHAR(40) NOT NULL,
    object_id VARCHAR(64) NULL,
    object_label VARCHAR(160) NOT NULL,
    request_id VARCHAR(64) NULL,
    PRIMARY KEY (id),
    KEY ix_audit_events_realm (realm, at),
    KEY ix_audit_events_object (object_type, object_id)
  ) ${TABLE_OPTIONS}`,
];

const tables = [
  'audit_events',
  'site_publications',
  'site_assets',
  'site_layouts',
  'site_navigation',
  'site_banners',
  'site_pages',
  'form_submissions',
  'outlet_order_events',
  'outlet_order_items',
  'outlet_orders',
  'outlet_quotes',
  'site_documents',
  'cuan_products',
  'reward_handovers',
  'vacancies',
  'programs',
  'indihome_packages',
  'outlet_packages',
  'outlet_categories',
  'customer_products',
  'sessions',
  'outlet_program_progress',
  'outlet_accounts',
  'staff_permissions',
  'staff_accounts',
];

export async function up(db: Kysely<Database>): Promise<void> {
  for (const statement of statements) {
    await sql.raw(statement).execute(db);
  }
}

/** Hanya untuk lingkungan pengembangan. Produksi memakai forward-fix, bukan rollback yang menghapus data. */
export async function down(db: Kysely<Database>): Promise<void> {
  for (const table of tables) {
    await sql.raw(`DROP TABLE IF EXISTS ${table}`).execute(db);
  }
}
