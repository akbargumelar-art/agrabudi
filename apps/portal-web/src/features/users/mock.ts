import {
  SCOPE_BY_ROLE,
  createOutletAccountSchema,
  createStaffAccountSchema,
  updateOutletAccountSchema,
  updateStaffAccountSchema,
  type CredentialIssueResult,
  type DataEnvelope,
  type ManagedOutletAccount,
  type ManagedStaffAccount,
} from '@agrabudi/contracts';
import type { z } from 'zod';
import { FieldError } from '../../auth/adapter';
import { demoAccounts } from '../../auth/mock';
import type { UserAdminAdapter } from './data';

/**
 * AKUN CONTOH untuk mencoba User Management. Tidak ada WhatsApp yang dikirim: kata sandi
 * sementara contoh dikembalikan dengan channel `mock` dan ditampilkan berlabel di layar.
 */
const MOCK_TEMP_PASSWORD = 'Contoh-Sementara-1';

function asMock<T>(data: T): DataEnvelope<T> {
  return {
    data,
    meta: {
      source: 'mock',
      asOf: new Date().toISOString(),
      note: 'Akun contoh. Tidak ada akun sungguhan yang dibuat dan tidak ada WhatsApp yang dikirim.',
    },
  };
}

const staff: ManagedStaffAccount[] = demoAccounts
  .filter((item) => item.role === 'admin' || item.role === 'supervisor' || item.role === 'salesforce')
  .filter((item) => item.unit === 'mobile' || item.unit === 'direct_sales')
  .map((item, index) => ({
    id: `contoh-akun-${index + 1}`,
    username: item.username,
    displayName: item.displayName,
    phone: `08120000${String(index + 10).padStart(4, '0')}`,
    role: item.role,
    unit: item.unit,
    scope: item.scope,
    permissions: item.permissions,
    status: 'active',
    mustChangePassword: false,
    isSelf: item.username === 'adminmobile',
  }));

const outlets: ManagedOutletAccount[] = ['CONTOH001', 'CONTOH002', 'CONTOH003'].map(
  (digiposId, index) => ({
    id: `contoh-outlet-${index + 1}`,
    digiposId,
    outletName: `Outlet contoh ${index + 1}`,
    ownerName: `Pemilik contoh ${index + 1}`,
    tap: null,
    phone: `08120000000${index + 1}`,
    registeredAt: '2025-01-02',
    status: 'active',
    mustChangePassword: false,
  }),
);

function parse<S extends z.ZodType>(schema: S, value: unknown): z.infer<S> {
  const parsed = schema.safeParse(value);
  if (parsed.success) return parsed.data;
  const fields: Record<string, string> = {};
  for (const issue of parsed.error.issues) fields[String(issue.path[0] ?? '_')] ??= issue.message;
  throw new FieldError('Isian belum sesuai.', fields);
}

const issued = (id: string): CredentialIssueResult => ({
  id,
  delivery: { channel: 'mock', temporaryPassword: MOCK_TEMP_PASSWORD },
});

function findOr404<T extends { id: string }>(list: T[], id: string): T {
  const found = list.find((item) => item.id === id);
  if (!found) throw new Error('Akun tidak ditemukan.');
  return found;
}

export const mockUserAdminAdapter: UserAdminAdapter = {
  listStaff: async () => asMock([...staff]),
  createStaff: async (input) => {
    const data = parse(createStaffAccountSchema, input);
    if (staff.some((item) => item.username === data.username)) {
      throw new FieldError('Username sudah dipakai.', { username: 'Username sudah dipakai.' });
    }
    const id = `contoh-akun-${Date.now()}`;
    staff.unshift({
      id,
      username: data.username,
      displayName: data.displayName,
      phone: data.phone,
      role: data.role,
      unit: data.unit,
      scope: SCOPE_BY_ROLE[data.role],
      permissions: data.permissions,
      status: 'active',
      mustChangePassword: true,
      isSelf: false,
    });
    return issued(id);
  },
  updateStaff: async (id, input) => {
    const data = parse(updateStaffAccountSchema, input);
    const row = findOr404(staff, id);
    if (row.isSelf && data.status !== 'active') {
      throw new Error('Akun yang sedang Anda pakai tidak bisa dinonaktifkan.');
    }
    Object.assign(row, data);
  },
  resetStaffPassword: async (id) => {
    const row = findOr404(staff, id);
    if (row.isSelf) throw new Error('Ganti kata sandi Anda sendiri lewat halaman Akun.');
    row.mustChangePassword = true;
    return issued(id);
  },
  listOutlets: async () => asMock([...outlets]),
  createOutlet: async (input) => {
    const data = parse(createOutletAccountSchema, input);
    if (outlets.some((item) => item.digiposId === data.digiposId)) {
      throw new FieldError('ID Digipos sudah terdaftar.', {
        digiposId: 'ID Digipos sudah terdaftar.',
      });
    }
    const id = `contoh-outlet-${Date.now()}`;
    outlets.unshift({ id, ...data, tap: data.tap || null, status: 'active', mustChangePassword: true });
    return issued(id);
  },
  updateOutlet: async (id, input) => {
    Object.assign(findOr404(outlets, id), parse(updateOutletAccountSchema, input));
  },
  resetOutletPassword: async (id) => {
    findOr404(outlets, id).mustChangePassword = true;
    return issued(id);
  },
};
