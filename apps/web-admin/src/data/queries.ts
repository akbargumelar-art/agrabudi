import { useQuery } from '@tanstack/react-query';
import { getAdapter } from './index';

export function usePages() {
  return useQuery({
    queryKey: ['web-admin', 'pages'],
    queryFn: async () => (await getAdapter()).listPages(),
  });
}

export function useBanners() {
  return useQuery({
    queryKey: ['web-admin', 'banners'],
    queryFn: async () => (await getAdapter()).listBanners(),
  });
}

export function usePublications() {
  return useQuery({
    queryKey: ['web-admin', 'publications'],
    queryFn: async () => (await getAdapter()).listPublications(),
  });
}
