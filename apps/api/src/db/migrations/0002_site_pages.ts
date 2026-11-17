import { sql, type Kysely } from 'kysely';
import type { Database } from '../types';

/**
 * Daftar halaman institusional website Publik dari inventaris PRD 2.6. Hanya struktur
 * (slug dan judul halaman yang memang ada di website), bukan isi atau klaim bisnis.
 * Status awal `published` karena route-nya sudah tayang; Admin Web bisa mengubahnya.
 */
const pages = [
  ['b6f0c1a2-0001-4000-8000-000000000001', 'tentang', 'Tentang Kami'],
  ['b6f0c1a2-0001-4000-8000-000000000002', 'tentang/area', 'Area Layanan'],
  ['b6f0c1a2-0001-4000-8000-000000000003', 'tentang/kantor', 'Lokasi Kantor'],
  ['b6f0c1a2-0001-4000-8000-000000000004', 'kontak', 'Hubungi Kami'],
] as const;

export async function up(db: Kysely<Database>): Promise<void> {
  for (const [id, slug, title] of pages) {
    await sql`
      INSERT INTO site_pages (id, site, slug, title, status, revision)
      VALUES (${id}, 'public', ${slug}, ${title}, 'published', 1)
      ON DUPLICATE KEY UPDATE id = id`.execute(db);
  }
}

export async function down(db: Kysely<Database>): Promise<void> {
  for (const [id] of pages) {
    await sql`DELETE FROM site_pages WHERE id = ${id}`.execute(db);
  }
}
