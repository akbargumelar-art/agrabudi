import {
  credentialIssueResultSchema,
  envelopeSchema,
  managedOutletAccountSchema,
  managedStaffAccountSchema,
  type CreateOutletAccount,
  type CreateStaffAccount,
  type CredentialIssueResult,
  type DataEnvelope,
  type ManagedOutletAccount,
  type ManagedStaffAccount,
  type UpdateOutletAccount,
  type UpdateStaffAccount,
} from '@agrabudi/contracts';
import { ApiRequestError, apiRequest } from '@agrabudi/contracts/http';
import { z } from 'zod';
import { FieldError } from '../../auth/adapter';

/**
 * Pintu data User Management. Mode `api`: server menentukan cakupan dari sesi dan
 * mengirim kata sandi sementara ke WhatsApp pemilik akun. Mode `mock`: data contoh di
 * memori dan kata sandi contoh ditampilkan berlabel (tidak ada WhatsApp yang dikirim).
 */
export interface UserAdminAdapter {
  listStaff(): Promise<DataEnvelope<ManagedStaffAccount[]>>;
  createStaff(input: CreateStaffAccount): Promise<CredentialIssueResult>;
  updateStaff(id: string, input: UpdateStaffAccount): Promise<void>;
  resetStaffPassword(id: string): Promise<CredentialIssueResult>;
  listOutlets(): Promise<DataEnvelope<ManagedOutletAccount[]>>;
  createOutlet(input: CreateOutletAccount): Promise<CredentialIssueResult>;
  updateOutlet(id: string, input: UpdateOutletAccount): Promise<void>;
  resetOutletPassword(id: string): Promise<CredentialIssueResult>;
}

const BASE = '/api/v1/admin/accounts';
const idResult = z.object({ id: z.string() });

async function call<S extends z.ZodType>(
  url: string,
  schema: S,
  init?: Parameters<typeof apiRequest>[2],
): Promise<z.infer<S>> {
  try {
    return await apiRequest(`${BASE}${url}`, schema, init);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 422) {
      throw new FieldError(error.message, error.fields);
    }
    throw error;
  }
}

export const apiUserAdminAdapter: UserAdminAdapter = {
  listStaff: () => call('/staff', envelopeSchema(z.array(managedStaffAccountSchema))),
  createStaff: (input) =>
    call('/staff', credentialIssueResultSchema, { method: 'POST', body: input }),
  updateStaff: async (id, input) => {
    await call(`/staff/${encodeURIComponent(id)}`, idResult, { method: 'PATCH', body: input });
  },
  resetStaffPassword: (id) =>
    call(`/staff/${encodeURIComponent(id)}/reset-password`, credentialIssueResultSchema, {
      method: 'POST',
    }),
  listOutlets: () => call('/outlets', envelopeSchema(z.array(managedOutletAccountSchema))),
  createOutlet: (input) =>
    call('/outlets', credentialIssueResultSchema, { method: 'POST', body: input }),
  updateOutlet: async (id, input) => {
    await call(`/outlets/${encodeURIComponent(id)}`, idResult, { method: 'PATCH', body: input });
  },
  resetOutletPassword: (id) =>
    call(`/outlets/${encodeURIComponent(id)}/reset-password`, credentialIssueResultSchema, {
      method: 'POST',
    }),
};

let adapterPromise: Promise<UserAdminAdapter> | undefined;

/** Data contoh hanya dimuat bila VITE_DATA_SOURCE=mock; pada build `api` cabang ini dibuang bundler. */
export function getUserAdminAdapter(): Promise<UserAdminAdapter> {
  if (!adapterPromise) {
    adapterPromise =
      import.meta.env.VITE_DATA_SOURCE === 'mock'
        ? import('./mock').then((module) => module.mockUserAdminAdapter)
        : Promise.resolve(apiUserAdminAdapter);
  }
  return adapterPromise;
}
