import {
  auditEventSchema,
  companyProfileSections,
  digiposInfoSchema,
  envelopeSchema,
  waGatewayStatusSchema,
  layoutSectionSchema,
  navItemSchema,
  publicationRecordSchema,
  siteAssetSchema,
  siteBannerSchema,
  sitePageSchema,
  type CompanyProfileSection,
  type CompanySectionData,
  type DataEnvelope,
  type SiteAsset,
} from '@agrabudi/contracts';
import { ApiRequestError, apiRequest, apiRequestRaw } from '@agrabudi/contracts/http';
import { z } from 'zod';
import { DataUnavailableError, type WebAdminDataAdapter } from './adapter';

/**
 * Adapter HTTP ke CMS API (/web-admin/api/v1). Hanya cookie sesi Admin Web yang berlaku di
 * path ini. Gambar dari form console (data URL) diunggah dulu sebagai aset, lalu banner
 * menyimpan alamat aset tersebut; server menolak gambar dari situs lain.
 */
const BASE = '/web-admin/api/v1';

async function read<S extends z.ZodType>(path: string, schema: S): Promise<z.infer<S>> {
  try {
    return await apiRequest(`${BASE}${path}`, schema);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404)
      throw new DataUnavailableError(error.message);
    throw error;
  }
}

async function send(path: string, init: Parameters<typeof apiRequestRaw>[1]) {
  try {
    return await apiRequestRaw(`${BASE}${path}`, init);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const firstField = Object.values(error.fields)[0];
      throw new Error(firstField ? `${error.message} ${firstField}` : error.message, {
        cause: error,
      });
    }
    throw error;
  }
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return (await fetch(dataUrl)).blob();
}

async function uploadAsset(input: Omit<SiteAsset, 'id' | 'uploadedAt'>): Promise<SiteAsset> {
  const form = new FormData();
  form.set('name', input.name);
  form.set('kind', input.kind);
  form.set('file', await dataUrlToBlob(input.url), input.name);
  return siteAssetSchema.parse(await send('/assets', { method: 'POST', body: form }));
}

const list = <S extends z.ZodType>(item: S) => envelopeSchema(z.array(item));

/** Skema bagian dipilih saat runtime; hasilnya sudah divalidasi skema bagian yang sama. */
async function getCompanySection<K extends CompanyProfileSection>(
  section: K,
): Promise<DataEnvelope<CompanySectionData<K> | null>> {
  const envelope = await read(
    `/company-profile/${section}`,
    envelopeSchema(companyProfileSections[section].nullable()),
  );
  return envelope as DataEnvelope<CompanySectionData<K> | null>;
}

export const apiAdapter: WebAdminDataAdapter = {
  listPages: () => read('/pages', list(sitePageSchema)),
  updatePageStatus: async (id, status) => {
    await send(`/pages/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status } });
  },
  listBanners: () => read('/banners', list(siteBannerSchema)),
  saveBanner: async (banner) => {
    let imageUrl = banner.imageUrl;
    if (imageUrl?.startsWith('data:')) {
      const asset = await uploadAsset({
        name: `Banner ${banner.title}`.slice(0, 100),
        kind: 'banner',
        url: imageUrl,
        sizeKb: 0,
      });
      imageUrl = asset.url;
    }
    const { id, ...body } = { ...banner, imageUrl };
    await send(`/banners/${encodeURIComponent(id)}`, { method: 'PUT', body });
  },
  deleteBanner: async (id) => {
    await send(`/banners/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
  listPublications: () => read('/publications', list(publicationRecordSchema)),
  listNavigation: () => read('/navigation', list(navItemSchema)),
  saveNavigation: async (items) => {
    await send('/navigation', { method: 'PUT', body: items });
  },
  listLayouts: () => read('/layouts', list(layoutSectionSchema)),
  saveLayouts: async (items) => {
    await send('/layouts', { method: 'PUT', body: items });
  },
  listAssets: () => read('/assets', list(siteAssetSchema)),
  addAsset: async (asset) => {
    await uploadAsset(asset);
  },
  deleteAsset: async (id) => {
    await send(`/assets/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
  listAudit: () => read('/audit', list(auditEventSchema)),
  getCompanySection,
  saveCompanySection: async (section, data) => {
    await send(`/company-profile/${section}`, { method: 'PUT', body: data });
  },
  getDigiposInfo: () => read('/digipos-info', envelopeSchema(digiposInfoSchema.nullable())),
  saveDigiposInfo: async (info) => {
    await send('/digipos-info', { method: 'PUT', body: info });
  },
  getWaGateway: () => read('/wa-gateway', envelopeSchema(waGatewayStatusSchema)),
  saveWaGateway: async (settings) => {
    await send('/wa-gateway', { method: 'PUT', body: settings });
  },
  testWaGateway: async (target) => {
    await send('/wa-gateway/test', { method: 'POST', body: { target } });
  },
};
