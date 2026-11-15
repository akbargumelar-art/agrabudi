import { useQuery } from '@tanstack/react-query';
import { getAdapter } from './index';

export function useCatalog() {
  return useQuery({
    queryKey: ['outlet', 'catalog'],
    queryFn: async () => (await getAdapter()).getCatalog(),
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ['outlet', 'orders'],
    queryFn: async () => (await getAdapter()).listOrders(),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['outlet', 'orders', id],
    queryFn: async () => (await getAdapter()).getOrder(id),
  });
}

export function usePrograms() {
  return useQuery({
    queryKey: ['outlet', 'programs'],
    queryFn: async () => (await getAdapter()).listPrograms(),
  });
}

export function useProgram(slug: string) {
  return useQuery({
    queryKey: ['outlet', 'programs', slug],
    queryFn: async () => (await getAdapter()).getProgram(slug),
  });
}
