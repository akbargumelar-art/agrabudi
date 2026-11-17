import type { Kysely, Transaction } from 'kysely';
import type { Database, SessionRealm } from '../db/types';

export type Actor = { realm: SessionRealm; id: string; label: string };

type AuditInput = {
  actor: Actor | { realm: 'public' | 'system'; id: null; label: string };
  action: string;
  objectType: string;
  objectId: string | null;
  objectLabel: string;
  requestId: string | null;
};

/**
 * Catat siapa melakukan apa pada objek apa (PRD 4.13). Tidak pernah menyimpan nilai rahasia
 * atau isi form pengguna; hanya label yang aman untuk dibaca pengelola.
 */
export async function audit(db: Kysely<Database> | Transaction<Database>, input: AuditInput) {
  await db
    .insertInto('auditEvents')
    .values({
      realm: input.actor.realm,
      actorId: input.actor.id,
      actorLabel: input.actor.label.slice(0, 80),
      action: input.action.slice(0, 60),
      objectType: input.objectType.slice(0, 40),
      objectId: input.objectId,
      objectLabel: input.objectLabel.slice(0, 160),
      requestId: input.requestId,
    })
    .execute();
}
