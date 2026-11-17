import { z } from 'zod';

/**
 * Bentuk respons gagal dari semua API (PRD 4.6). Pesan aman untuk ditampilkan,
 * tanpa SQL atau stack trace. `requestId` dipakai saat melapor gangguan.
 */
export const apiErrorCodeSchema = z.enum([
  'VALIDATION_FAILED',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'QUOTE_EXPIRED',
  'QUOTE_CHANGED',
  'INVALID_TRANSITION',
  'VACANCY_CLOSED',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_FILE',
  'RATE_LIMITED',
  'ORIGIN_REJECTED',
  'SERVICE_UNAVAILABLE',
  'INTERNAL',
]);
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

export const apiErrorSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    /** Pesan per kolom input, bila kesalahan validasi. */
    fields: z.record(z.string(), z.string()).optional(),
    requestId: z.string(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

/** Header idempotensi untuk order dan kiriman form (PRD 4.5, US-06, US-08). */
export const IDEMPOTENCY_HEADER = 'idempotency-key';
export const idempotencyKeySchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{16,64}$/, 'Idempotency-Key 16 sampai 64 karakter huruf, angka, - atau _.');
