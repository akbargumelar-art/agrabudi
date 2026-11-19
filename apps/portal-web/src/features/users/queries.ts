import type {
  CreateOutletAccount,
  CreateStaffAccount,
  UpdateOutletAccount,
  UpdateStaffAccount,
} from '@agrabudi/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserAdminAdapter } from './data';

const root = ['portal', 'user-management'];

function useChange<I, R>(run: (input: I) => Promise<R>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => client.invalidateQueries({ queryKey: root }),
  });
}

export const useStaffAccounts = () =>
  useQuery({
    queryKey: [...root, 'staff'],
    queryFn: async () => (await getUserAdminAdapter()).listStaff(),
  });

export const useOutletAccounts = (enabled: boolean) =>
  useQuery({
    queryKey: [...root, 'outlets'],
    queryFn: async () => (await getUserAdminAdapter()).listOutlets(),
    enabled,
  });

export const useCreateStaff = () =>
  useChange(async (input: CreateStaffAccount) => (await getUserAdminAdapter()).createStaff(input));
export const useUpdateStaff = () =>
  useChange(async (input: { id: string; data: UpdateStaffAccount }) =>
    (await getUserAdminAdapter()).updateStaff(input.id, input.data),
  );
export const useResetStaff = () =>
  useChange(async (id: string) => (await getUserAdminAdapter()).resetStaffPassword(id));

export const useCreateOutlet = () =>
  useChange(async (input: CreateOutletAccount) =>
    (await getUserAdminAdapter()).createOutlet(input),
  );
export const useUpdateOutlet = () =>
  useChange(async (input: { id: string; data: UpdateOutletAccount }) =>
    (await getUserAdminAdapter()).updateOutlet(input.id, input.data),
  );
export const useResetOutlet = () =>
  useChange(async (id: string) => (await getUserAdminAdapter()).resetOutletPassword(id));
