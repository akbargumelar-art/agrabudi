import { sql, type Kysely } from 'kysely';
import type { Database } from '../types';

export async function up(db: Kysely<Database>): Promise<void> {
  await sql`ALTER TABLE site_documents MODIFY COLUMN \`key\` ENUM(
    'company_profile','indihome_info','digipos_info','cuan_contact','wa_notifications'
  ) NOT NULL`.execute(db);
}

export async function down(db: Kysely<Database>): Promise<void> {
  await sql`DELETE FROM site_documents WHERE \`key\` = 'wa_notifications'`.execute(db);
  await sql`ALTER TABLE site_documents MODIFY COLUMN \`key\` ENUM(
    'company_profile','indihome_info','digipos_info','cuan_contact'
  ) NOT NULL`.execute(db);
}
