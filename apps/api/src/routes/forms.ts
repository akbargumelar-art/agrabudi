import {
  CV_MAX_BYTES,
  IDEMPOTENCY_HEADER,
  contactFormSchema,
  digiposRegistrationFormSchema,
  idempotencyKeySchema,
  indihomeInterestFormSchema,
  jobApplicationFormSchema,
  type FormReceipt,
  type PublicFormKind,
} from '@agrabudi/contracts';
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { Db } from '../db/database';
import { isDuplicateKey } from '../db/database';
import { toVacancy } from '../domain/content';
import { audit } from '../lib/audit';
import { detectDocument, safeDisplayName } from '../lib/file-type';
import { HttpError, invalid, notFound } from '../lib/errors';
import { newId, referenceNumber } from '../lib/ids';
import { parse } from '../lib/http';

const PREFIX: Record<PublicFormKind, string> = {
  contact: 'PSN',
  indihome_interest: 'MNT',
  digipos_registration: 'DGP',
  job_application: 'LMR',
};

/** Batas laju form publik per IP (PRD 4.13). */
const FORM_RATE = { rateLimit: { max: 10, timeWindow: '10 minutes' } };

function idempotencyKey(request: FastifyRequest): string {
  const raw = request.headers[IDEMPOTENCY_HEADER];
  return parse(idempotencyKeySchema, typeof raw === 'string' ? raw : '');
}

async function existingReceipt(
  db: Db,
  kind: PublicFormKind,
  key: string,
): Promise<FormReceipt | null> {
  const row = await db
    .selectFrom('formSubmissions')
    .select(['reference', 'createdAt'])
    .where('kind', '=', kind)
    .where('idempotencyKey', '=', key)
    .executeTakeFirst();
  return row ? { reference: row.reference, receivedAt: row.createdAt.toISOString() } : null;
}

type Submission = {
  kind: PublicFormKind;
  key: string;
  payload: Record<string, string>;
  vacancyId?: string;
  cv?: { fileKey: string; fileName: string; mime: string; size: number };
};

/**
 * Simpan kiriman. Kiriman ulang dengan Idempotency-Key yang sama mengembalikan nomor
 * referensi yang sama, bukan membuat duplikat (US-08). Isi form tidak masuk log maupun audit.
 */
async function store(
  db: Db,
  submission: Submission,
  requestId: string,
): Promise<{ receipt: FormReceipt; created: boolean }> {
  const earlier = await existingReceipt(db, submission.kind, submission.key);
  if (earlier) return { receipt: earlier, created: false };
  const id = newId();
  const reference = referenceNumber(PREFIX[submission.kind]);
  try {
    await db
      .insertInto('formSubmissions')
      .values({
        id,
        reference,
        kind: submission.kind,
        idempotencyKey: submission.key,
        payload: JSON.stringify(submission.payload),
        vacancyId: submission.vacancyId ?? null,
        cvFileKey: submission.cv?.fileKey ?? null,
        cvFileName: submission.cv?.fileName ?? null,
        cvMime: submission.cv?.mime ?? null,
        cvSizeBytes: submission.cv?.size ?? null,
        statusNote: null,
      })
      .execute();
  } catch (error) {
    if (isDuplicateKey(error)) {
      const winner = await existingReceipt(db, submission.kind, submission.key);
      if (winner) return { receipt: winner, created: false };
    }
    throw error;
  }
  await audit(db, {
    actor: { realm: 'public', id: null, label: 'Pengunjung website' },
    action: `form.${submission.kind}`,
    objectType: 'form_submission',
    objectId: id,
    objectLabel: reference,
    requestId,
  });
  const row = await db
    .selectFrom('formSubmissions')
    .select('createdAt')
    .where('id', '=', id)
    .executeTakeFirstOrThrow();
  return { receipt: { reference, receivedAt: row.createdAt.toISOString() }, created: true };
}

const vacancyParams = z.object({ slug: z.string().min(1).max(120) });

/** Form publik (/api/public/v1/forms). Nomor referensi dibuat server (US-09). */
export const formRoutes: FastifyPluginAsync = async (app) => {
  const { db, storage } = app.deps;

  const simple = (
    path: string,
    kind: PublicFormKind,
    schema: z.ZodType<Record<string, string>>,
  ) => {
    app.post(path, { config: FORM_RATE }, async (request, reply) => {
      const key = idempotencyKey(request);
      const payload = parse(schema, request.body);
      const { receipt, created } = await store(db, { kind, key, payload }, request.id);
      return reply.code(created ? 201 : 200).send(receipt);
    });
  };
  simple('/contact', 'contact', contactFormSchema);
  simple('/indihome-interest', 'indihome_interest', indihomeInterestFormSchema);
  simple('/digipos-registration', 'digipos_registration', digiposRegistrationFormSchema);

  /**
   * Lamaran: multipart dengan berkas `cv`. Lowongan tutup menolak kiriman baru. CV disimpan
   * di area privat dengan nama buatan server; jenis diperiksa dari isi berkas (US-08).
   */
  app.post('/job-application/:slug', { config: FORM_RATE }, async (request, reply) => {
    const { slug } = parse(vacancyParams, request.params);
    const key = idempotencyKey(request);
    if (!request.isMultipart())
      throw invalid('Lamaran harus dikirim sebagai form dengan berkas CV.');

    const vacancyRow = await db
      .selectFrom('vacancies')
      .selectAll()
      .where('slug', '=', slug)
      .where('status', '!=', 'draft')
      .executeTakeFirst();
    if (!vacancyRow) throw notFound('Lowongan tidak ditemukan.');
    if (toVacancy(vacancyRow).status !== 'open') {
      throw new HttpError(
        409,
        'VACANCY_CLOSED',
        'Lowongan ini sudah ditutup dan tidak menerima lamaran baru.',
      );
    }

    const earlier = await existingReceipt(db, 'job_application', key);
    if (earlier) return reply.code(200).send(earlier);

    const fields: Record<string, string> = {};
    let cvData: Buffer | null = null;
    let cvName = '';
    for await (const part of request.parts()) {
      if (part.type === 'file') {
        if (part.fieldname !== 'cv' || cvData) {
          part.file.resume();
          continue;
        }
        cvData = await part.toBuffer();
        cvName = safeDisplayName(part.filename);
      } else if (typeof part.value === 'string') {
        fields[part.fieldname] = part.value;
      }
    }
    const form = parse(jobApplicationFormSchema, fields);
    if (!cvData || cvData.length === 0)
      throw invalid('CV wajib dilampirkan.', { cv: 'CV wajib dilampirkan.' });
    if (cvData.length > CV_MAX_BYTES) {
      throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Ukuran CV melebihi 2 MB.', {
        cv: 'Ukuran CV melebihi 2 MB.',
      });
    }
    const detected = detectDocument(cvData);
    if (!detected) {
      throw new HttpError(415, 'UNSUPPORTED_FILE', 'CV harus berupa PDF atau dokumen Word.', {
        cv: 'CV harus PDF, DOC, atau DOCX.',
      });
    }

    const fileKey = await storage.put('private', detected.ext, cvData);
    try {
      const { receipt, created } = await store(
        db,
        {
          kind: 'job_application',
          key,
          payload: {
            name: form.name,
            email: form.email,
            phone: form.phone,
            vacancyTitle: vacancyRow.title,
          },
          vacancyId: vacancyRow.id,
          cv: { fileKey, fileName: cvName, mime: detected.mime, size: cvData.length },
        },
        request.id,
      );
      if (!created) await storage.remove('private', fileKey);
      return reply.code(created ? 201 : 200).send(receipt);
    } catch (error) {
      // Jangan tinggalkan CV yatim tanpa catatan lamaran.
      await storage.remove('private', fileKey);
      throw error;
    }
  });
};
