import {
  IDEMPOTENCY_HEADER,
  cuanContactSchema,
  cuanProductSchema,
  envelopeSchema,
  outletCatalogSchema,
  outletOrderSchema,
  outletProfileSchema,
  outletQuoteSchema,
  programSchema,
  rewardHandoverSchema,
  type DataEnvelope,
} from '@agrabudi/contracts';
import { ApiRequestError, apiRequest } from '@agrabudi/contracts/http';
import { z } from 'zod';
import { DataUnavailableError, type OutletDataAdapter } from './adapter';

/**
 * Adapter HTTP ke /api/v1/outlet. Outlet yang dilayani ditentukan server dari cookie sesi;
 * parameter `digiposId` dari halaman tidak dikirim (PRD 4.6).
 */
const BASE = '/api/v1/outlet';

/** Data yang belum diterbitkan (404) ditampilkan sebagai tidak tersedia, bukan error teknis. */
async function read<S extends z.ZodType>(path: string, schema: S): Promise<z.infer<S>> {
  try {
    return await apiRequest(`${BASE}${path}`, schema);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      throw new DataUnavailableError(error.message);
    }
    throw error;
  }
}

const withMeta = <T>(envelope: { data: T; meta: DataEnvelope<T>['meta'] }): DataEnvelope<T> =>
  envelope;

export const apiAdapter: OutletDataAdapter = {
  getCatalog: async () => withMeta(await read('/catalog', envelopeSchema(outletCatalogSchema))),
  listOrders: async () =>
    withMeta(await read('/orders', envelopeSchema(z.array(outletOrderSchema)))),
  getOrder: async (_digiposId, id) =>
    withMeta(
      await read(`/orders/${encodeURIComponent(id)}`, envelopeSchema(outletOrderSchema.nullable())),
    ),
  createQuote: async (_digiposId, request) => {
    const quote = await apiRequest(`${BASE}/quotes`, outletQuoteSchema, {
      method: 'POST',
      body: request,
    });
    return { data: quote, meta: { source: 'api', asOf: quote.createdAt } };
  },
  createOrder: async (_digiposId, quoteId, idempotencyKey) => {
    const order = await apiRequest(`${BASE}/orders`, outletOrderSchema, {
      method: 'POST',
      body: { quoteId },
      headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
    });
    return { data: order, meta: { source: 'api', asOf: new Date().toISOString() } };
  },
  listPrograms: async () =>
    withMeta(await read('/programs', envelopeSchema(z.array(programSchema)))),
  getProgram: async (slug) =>
    withMeta(
      await read(`/programs/${encodeURIComponent(slug)}`, envelopeSchema(programSchema.nullable())),
    ),
  listRewardHandovers: async () =>
    withMeta(await read('/reward-handovers', envelopeSchema(z.array(rewardHandoverSchema)))),
  getOutletProfile: async () =>
    withMeta(await read('/profile', envelopeSchema(outletProfileSchema.nullable()))),
  listCuanProducts: async () =>
    withMeta(await read('/cuan-products', envelopeSchema(z.array(cuanProductSchema)))),
  getCuanContact: async () =>
    withMeta(await read('/cuan-contact', envelopeSchema(cuanContactSchema))),
};
