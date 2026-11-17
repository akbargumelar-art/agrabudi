import type { ApiError, ApiErrorCode } from '@agrabudi/contracts';
import type { FastifyError, FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { isDbUnavailable } from '../db/database';

/** Error yang sengaja dilempar kode aplikasi: status, kode, dan pesan aman untuk pengguna. */
export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const unauthenticated = () =>
  new HttpError(401, 'UNAUTHENTICATED', 'Sesi Anda sudah berakhir atau belum masuk.');
export const forbidden = (message = 'Akun Anda tidak punya izin untuk aksi ini.') =>
  new HttpError(403, 'FORBIDDEN', message);
export const notFound = (message = 'Data tidak ditemukan.') =>
  new HttpError(404, 'NOT_FOUND', message);
export const conflict = (message: string, code: ApiErrorCode = 'CONFLICT') =>
  new HttpError(409, code, message);
export const invalid = (message: string, fields?: Record<string, string>) =>
  new HttpError(422, 'VALIDATION_FAILED', message, fields);

export function zodFields(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    fields[key] ??= issue.message;
  }
  return fields;
}

function body(
  requestId: string,
  code: ApiErrorCode,
  message: string,
  fields?: Record<string, string>,
): ApiError {
  return { error: { code, message, requestId, ...(fields ? { fields } : {}) } };
}

/**
 * Semua error dijawab dengan bentuk yang sama. Detail teknis (SQL, stack) hanya masuk log
 * server, tidak pernah ke respons (PRD 4.6, 4.13).
 */
export function registerErrorHandling(app: FastifyInstance) {
  app.setNotFoundHandler((request, reply) => {
    void reply.code(404).send(body(request.id, 'NOT_FOUND', 'Alamat API tidak ditemukan.'));
  });

  app.setErrorHandler((error: FastifyError | Error, request, reply) => {
    if (error instanceof HttpError) {
      return reply
        .code(error.statusCode)
        .send(body(request.id, error.code, error.message, error.fields));
    }
    if (error instanceof ZodError) {
      return reply
        .code(422)
        .send(body(request.id, 'VALIDATION_FAILED', 'Isian belum sesuai.', zodFields(error)));
    }
    if (isDbUnavailable(error)) {
      request.log.error({ err: error }, 'database tidak tersedia');
      return reply
        .code(503)
        .send(
          body(
            request.id,
            'SERVICE_UNAVAILABLE',
            'Layanan sedang terganggu. Coba lagi beberapa saat.',
          ),
        );
    }
    const fastifyError = error as FastifyError;
    const statusCode = fastifyError.statusCode ?? 500;
    if (statusCode === 429) {
      return reply
        .code(429)
        .send(
          body(
            request.id,
            'RATE_LIMITED',
            'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.',
          ),
        );
    }
    if (statusCode === 413 || fastifyError.code === 'FST_REQ_FILE_TOO_LARGE') {
      return reply
        .code(413)
        .send(body(request.id, 'PAYLOAD_TOO_LARGE', 'Ukuran kiriman atau berkas melebihi batas.'));
    }
    if (statusCode >= 400 && statusCode < 500) {
      // Kesalahan format permintaan (JSON rusak, content-type salah) tanpa membocorkan detail parser.
      return reply
        .code(400)
        .send(body(request.id, 'VALIDATION_FAILED', 'Format permintaan tidak dapat dibaca.'));
    }
    request.log.error({ err: error }, 'kesalahan tak terduga');
    return reply
      .code(500)
      .send(body(request.id, 'INTERNAL', 'Terjadi kesalahan di server. Coba lagi beberapa saat.'));
  });
}
