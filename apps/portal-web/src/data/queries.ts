import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../auth/SessionContext';
import { getPortalAdapter } from './index';
import type { RowInput } from './types';

/** Data satu menu Portal, sudah disaring sesuai cakupan sesi. */
export function useDataset(path: string) {
  const session = useSession();
  return useQuery({
    queryKey: ['portal', 'dataset', path, session.username],
    queryFn: async () => (await getPortalAdapter()).getDataset(path, session),
  });
}

export function useDatasetMutations(path: string) {
  const session = useSession();
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: ['portal', 'dataset'] });
  const save = useMutation({
    mutationFn: async (input: RowInput) => (await getPortalAdapter()).saveRow(path, input, session),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: async (rowId: string) => (await getPortalAdapter()).deleteRow(path, rowId, session),
    onSuccess: refresh,
  });
  const importRows = useMutation({
    mutationFn: async (input: {
      fileName: string;
      rows: Array<Record<string, string>>;
      rejected: number;
    }) => (await getPortalAdapter()).importRows(path, input.fileName, input.rows, input.rejected, session),
    onSuccess: refresh,
  });
  return { save, remove, importRows };
}
