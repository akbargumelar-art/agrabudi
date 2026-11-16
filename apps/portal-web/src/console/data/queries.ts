import type { ContentStatus, SiteBanner, SiteSettings } from '@agrabudi/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdapter } from './index';
import type { LayoutSection, NavItem, SiteAsset } from './types';

const root = ['web-admin'];

function useList<T>(key: string, load: () => Promise<T>) {
  return useQuery({ queryKey: [...root, key], queryFn: load });
}

/** Setiap perubahan menyegarkan semua data website, termasuk audit dan riwayat publikasi. */
function useChange<I>(run: (input: I) => Promise<unknown>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => client.invalidateQueries({ queryKey: root }),
  });
}

export const usePages = () => useList('pages', async () => (await getAdapter()).listPages());
export const useBanners = () => useList('banners', async () => (await getAdapter()).listBanners());
export const usePublications = () =>
  useList('publications', async () => (await getAdapter()).listPublications());
export const useSiteSettings = () =>
  useList('site-settings', async () => (await getAdapter()).getSiteSettings());
export const useNavigation = () =>
  useList('navigation', async () => (await getAdapter()).listNavigation());
export const useLayouts = () => useList('layouts', async () => (await getAdapter()).listLayouts());
export const useAssets = () => useList('assets', async () => (await getAdapter()).listAssets());
export const useAudit = () => useList('audit', async () => (await getAdapter()).listAudit());

export const useUpdateSiteSettings = () =>
  useChange(async (next: SiteSettings) => (await getAdapter()).updateSiteSettings(next));
export const useUpdatePageStatus = () =>
  useChange(async (input: { id: string; status: ContentStatus }) =>
    (await getAdapter()).updatePageStatus(input.id, input.status),
  );
export const useSaveBanner = () =>
  useChange(async (banner: SiteBanner) => (await getAdapter()).saveBanner(banner));
export const useDeleteBanner = () =>
  useChange(async (id: string) => (await getAdapter()).deleteBanner(id));
export const useSaveNavigation = () =>
  useChange(async (items: NavItem[]) => (await getAdapter()).saveNavigation(items));
export const useSaveLayouts = () =>
  useChange(async (items: LayoutSection[]) => (await getAdapter()).saveLayouts(items));
export const useAddAsset = () =>
  useChange(async (asset: Omit<SiteAsset, 'id' | 'uploadedAt'>) => (await getAdapter()).addAsset(asset));
export const useDeleteAsset = () =>
  useChange(async (id: string) => (await getAdapter()).deleteAsset(id));
