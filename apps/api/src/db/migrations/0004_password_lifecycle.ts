import { sql, type Kysely } from 'kysely';
import type { Database } from '../types';

/**
 * Siklus kata sandi: penanda kata sandi sementara (wajib diganti saat login) dan kode reset
 * mandiri lewat WhatsApp. Akun yang sudah ada tidak dipaksa ganti (DEFAULT 0); kata sandinya
 * dibuat pemiliknya sendiri lewat CLI.
 *
 * Kode reset disimpan sebagai hash, bukan teks. Satu akun hanya punya satu kode aktif: kode
 * lama ditandai terpakai saat kode baru dibuat.
 */
const TABLE_OPTIONS = 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';

export async function up(db: Kysely<Database>): Promise<void> {
  await sql`ALTER TABLE staff_accounts
    ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0 AFTER password_hash,
    ADD COLUMN password_changed_at DATETIME(3) NULL AFTER must_change_password`.execute(db);
  await sql`ALTER TABLE outlet_accounts
    ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0 AFTER password_hash,
    ADD COLUMN password_changed_at DATETIME(3) NULL AFTER must_change_password`.execute(db);
  await sql
    .raw(
      `CREATE TABLE password_reset_codes (
        id CHAR(36) NOT NULL,
        realm ENUM('staff','outlet') NOT NULL,
        account_id CHAR(36) NOT NULL,
        code_hash CHAR(64) NOT NULL,
        attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        expires_at DATETIME(3) NOT NULL,
        used_at DATETIME(3) NULL,
        PRIMARY KEY (id),
        KEY ix_password_reset_codes_account (realm, account_id, created_at)
      ) ${TABLE_OPTIONS}`,
    )
    .execute(db);
}

export async function down(db: Kysely<Database>): Promise<void> {
  await sql`DROP TABLE password_reset_codes`.execute(db);
  await sql`ALTER TABLE outlet_accounts DROP COLUMN password_changed_at, DROP COLUMN must_change_password`.execute(
    db,
  );
  await sql`ALTER TABLE staff_accounts DROP COLUMN password_changed_at, DROP COLUMN must_change_password`.execute(
    db,
  );
}
