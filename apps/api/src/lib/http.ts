import type { DataEnvelope } from '@agrabudi/contracts';
import type { z } from 'zod';

/** Setiap data dari API membawa `source: "api"` (PRD 3.3). */
export function envelope<T>(data: T): DataEnvelope<T> {
  return { data, meta: { source: 'api', asOf: new Date().toISOString() } };
}

/** Validasi isian dengan skema kontrak. Gagal = ZodError, dijawab 422 oleh error handler. */
export function parse<S extends z.ZodType>(schema: S, value: unknown): z.infer<S> {
  return schema.parse(value);
}

export function iso(date: Date): string {
  return date.toISOString();
}

/** Tanggal hari ini di WIB (UTC+7) sebagai YYYY-MM-DD, untuk membandingkan periode bisnis. */
export function todayWib(now = new Date()): string {
  return new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
