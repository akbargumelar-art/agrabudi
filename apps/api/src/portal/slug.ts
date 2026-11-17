import type { Db } from '../db/database';
import { slugify } from '../lib/ids';

type SluggedTable = 'vacancies' | 'programs' | 'customerProducts';

/** Slug unik dari judul. Slug yang sudah terbit tidak diubah saat judul diedit, supaya tautan lama tetap hidup. */
export async function uniqueSlug(db: Db, table: SluggedTable, title: string): Promise<string> {
  const base = slugify(title);
  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const taken = await db
      .selectFrom(table)
      .select('id')
      .where('slug', '=', candidate)
      .executeTakeFirst();
    if (!taken) return candidate;
  }
  throw new Error('Tidak menemukan slug unik.');
}
