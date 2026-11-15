import {
  publicationRecordSchema,
  siteBannerSchema,
  sitePageSchema,
  type DataEnvelope,
  type PublicationRecord,
  type SiteBanner,
  type SitePage,
} from '@agrabudi/contracts';
import type { WebAdminDataAdapter } from '../adapter';

/**
 * DATA CONTOH untuk kerangka console. Judul, status, dan tanggal di bawah rekaan;
 * bukan isi website resmi dan tidak boleh dipakai sebagai seed produksi.
 */
const pages: SitePage[] = [
  {
    id: 'hal-1',
    site: 'public',
    slug: 'tentang',
    title: 'Tentang Kami (contoh)',
    status: 'published',
    updatedAt: '2026-11-08T04:00:00Z',
  },
  {
    id: 'hal-2',
    site: 'public',
    slug: 'tentang/area',
    title: 'Area layanan (contoh)',
    status: 'draft',
    updatedAt: '2026-11-12T09:30:00Z',
  },
  {
    id: 'hal-3',
    site: 'public',
    slug: 'tentang/kantor',
    title: 'Lokasi kantor (contoh)',
    status: 'review',
    updatedAt: '2026-11-13T02:10:00Z',
  },
  {
    id: 'hal-4',
    site: 'public',
    slug: 'kontak',
    title: 'Hubungi Kami (contoh)',
    status: 'archived',
    updatedAt: '2026-10-28T07:45:00Z',
  },
].map((page) => sitePageSchema.parse(page));

const banners: SiteBanner[] = [
  {
    id: 'banner-1',
    site: 'public',
    page: 'home',
    slot: 'hero',
    title: 'Banner contoh hero',
    imageUrl: null,
    startsAt: '2026-11-01',
    endsAt: '2026-11-30',
    status: 'published',
  },
  {
    id: 'banner-2',
    site: 'outlet',
    page: 'home',
    slot: 'atas',
    title: 'Banner contoh mitra',
    imageUrl: null,
    startsAt: '2026-12-01',
    endsAt: '2026-12-31',
    status: 'draft',
  },
].map((banner) => siteBannerSchema.parse(banner));

const publications: PublicationRecord[] = [
  {
    id: 'pub-2',
    objectType: 'banner',
    objectTitle: 'Banner contoh hero',
    revision: 2,
    publishedAt: '2026-11-09T03:00:00Z',
  },
  {
    id: 'pub-1',
    objectType: 'page',
    objectTitle: 'Tentang Kami (contoh)',
    revision: 1,
    publishedAt: '2026-11-08T04:00:00Z',
  },
].map((record) => publicationRecordSchema.parse(record));

function asMock<T>(data: T): DataEnvelope<T> {
  return {
    data,
    meta: {
      source: 'mock',
      asOf: new Date().toISOString(),
      note: 'Data contoh untuk kerangka console. Bukan isi website resmi.',
    },
  };
}

export const mockAdapter: WebAdminDataAdapter = {
  listPages: async () => asMock(pages),
  listBanners: async () => asMock(banners),
  listPublications: async () => asMock(publications),
};
