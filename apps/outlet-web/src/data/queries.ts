import { useQuery } from '@tanstack/react-query';
import { getAdapter } from './index';

export function useSiteSettings() {
  return useQuery({
    queryKey: ['outlet', 'site-settings'],
    queryFn: async () => (await getAdapter()).getSiteSettings(),
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
