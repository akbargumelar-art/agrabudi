import type { OutletQuoteRequest } from '@agrabudi/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdapter } from './index';

export function useCatalog() {
  return useQuery({
    queryKey: ['outlet', 'catalog'],
    queryFn: async () => (await getAdapter()).getCatalog(),
  });
}

export function useOrders(digiposId: string) {
  return useQuery({
    queryKey: ['outlet', 'orders', digiposId],
    queryFn: async () => (await getAdapter()).listOrders(digiposId),
  });
}

export function useOrder(digiposId: string, id: string) {
  return useQuery({
    queryKey: ['outlet', 'orders', digiposId, id],
    queryFn: async () => (await getAdapter()).getOrder(digiposId, id),
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

export function useRewardHandovers() {
  return useQuery({
    queryKey: ['outlet', 'reward-handovers'],
    queryFn: async () => (await getAdapter()).listRewardHandovers(),
  });
}

export function useOutletProfile(digiposId: string | null) {
  return useQuery({
    queryKey: ['outlet', 'profile', digiposId],
    queryFn: async () => (await getAdapter()).getOutletProfile(digiposId ?? ''),
    enabled: digiposId !== null,
  });
}

export function useCuanProducts() {
  return useQuery({
    queryKey: ['outlet', 'cuan-products'],
    queryFn: async () => (await getAdapter()).listCuanProducts(),
  });
}

export function useCuanContact() {
  return useQuery({
    queryKey: ['outlet', 'cuan-contact'],
    queryFn: async () => (await getAdapter()).getCuanContact(),
  });
}

export function useCreateQuote(digiposId: string) {
  return useMutation({
    mutationFn: async (request: OutletQuoteRequest) =>
      (await getAdapter()).createQuote(digiposId, request),
  });
}

/** Order baru menyegarkan daftar pesanan outlet ini. */
export function useCreateOrder(digiposId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { quoteId: string; idempotencyKey: string }) =>
      (await getAdapter()).createOrder(digiposId, input.quoteId, input.idempotencyKey),
    onSuccess: () => client.invalidateQueries({ queryKey: ['outlet', 'orders', digiposId] }),
  });
}
