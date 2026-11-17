import type { z } from 'zod';
import { apiErrorSchema, type ApiErrorCode } from './api';

/*
 * Klien HTTP untuk frontend (browser dan server Next.js). Diekspor lewat subpath
 * `@agrabudi/contracts/http` supaya API (Node tanpa lib DOM) tidak ikut memuatnya.
 */

/**
 * Kegagalan memanggil API dengan kode dan pesan aman dari server. Gangguan jaringan
 * menjadi `SERVICE_UNAVAILABLE` (status 0), tidak pernah dianggap berhasil (PRD US-16).
 */
export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly fields: Record<string, string> = {},
    readonly requestId: string | null = null,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export type ApiRequestInit = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Objek dikirim sebagai JSON; FormData dikirim apa adanya (multipart). */
  body?: unknown;
  headers?: Record<string, string>;
  /** Next.js server: `no-store` supaya halaman selalu membaca data terbaru. */
  cache?: RequestCache;
  signal?: AbortSignal;
};

/**
 * Panggil API lalu validasi bentuk respons dengan skema kontrak. Respons yang tidak cocok
 * kontrak dianggap gangguan, bukan ditampilkan setengah benar.
 */
export async function apiRequest<S extends z.ZodType>(
  url: string,
  schema: S,
  init: ApiRequestInit = {},
): Promise<z.infer<S>> {
  const raw = await apiRequestRaw(url, init);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiRequestError(
      502,
      'INTERNAL',
      'Respons server tidak sesuai format yang disepakati.',
    );
  }
  return parsed.data;
}

/** Sama seperti `apiRequest` tanpa validasi, untuk respons kosong (204). */
export async function apiRequestRaw(url: string, init: ApiRequestInit = {}): Promise<unknown> {
  const headers: Record<string, string> = { accept: 'application/json', ...init.headers };
  let body: BodyInit | undefined;
  if (init.body instanceof FormData) {
    body = init.body;
  } else if (init.body !== undefined) {
    headers['content-type'] = 'application/json';
    body = JSON.stringify(init.body);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: init.method ?? 'GET',
      headers,
      body,
      credentials: 'same-origin',
      cache: init.cache,
      signal: init.signal,
    });
  } catch {
    throw new ApiRequestError(
      0,
      'SERVICE_UNAVAILABLE',
      'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.',
    );
  }

  if (response.status === 204) return undefined;
  const text = await response.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    // Badan respons bukan JSON (mis. halaman error proxy): diperlakukan sebagai gangguan di bawah.
    json = undefined;
  }

  if (!response.ok) {
    const error = apiErrorSchema.safeParse(json);
    if (error.success) {
      const { code, message, fields, requestId } = error.data.error;
      throw new ApiRequestError(response.status, code, message, fields, requestId);
    }
    throw new ApiRequestError(
      response.status,
      response.status >= 500 ? 'SERVICE_UNAVAILABLE' : 'INTERNAL',
      'Layanan sedang terganggu. Coba lagi beberapa saat.',
    );
  }
  return json;
}

/** Kunci idempotensi acak untuk satu percobaan kirim. Diulang dengan key yang sama saat retry. */
export function newIdempotencyKey(): string {
  return crypto.randomUUID().replaceAll('-', '');
}
