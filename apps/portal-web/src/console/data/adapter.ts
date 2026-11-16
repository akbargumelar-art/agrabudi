import type {
  ContentStatus,
  DataEnvelope,
  PublicationRecord,
  SiteBanner,
  SitePage,
  SiteSettings,
} from '@agrabudi/contracts';
import type { AuditEvent, LayoutSection, NavItem, SiteAsset } from './types';

/**
 * Pintu data pengaturan website (peran Admin Web). Hanya konten institusional:
 * tidak ada akses ke produk, harga, order, lamaran, atau fee (PRD 2.4).
 */
export interface WebAdminDataAdapter {
  listPages(): Promise<DataEnvelope<SitePage[]>>;
  updatePageStatus(id: string, status: ContentStatus): Promise<void>;
  listBanners(): Promise<DataEnvelope<SiteBanner[]>>;
  saveBanner(banner: SiteBanner): Promise<void>;
  deleteBanner(id: string): Promise<void>;
  listPublications(): Promise<DataEnvelope<PublicationRecord[]>>;
  getSiteSettings(): Promise<DataEnvelope<SiteSettings>>;
  updateSiteSettings(next: SiteSettings): Promise<DataEnvelope<SiteSettings>>;
  listNavigation(): Promise<DataEnvelope<NavItem[]>>;
  saveNavigation(items: NavItem[]): Promise<void>;
  listLayouts(): Promise<DataEnvelope<LayoutSection[]>>;
  saveLayouts(items: LayoutSection[]): Promise<void>;
  listAssets(): Promise<DataEnvelope<SiteAsset[]>>;
  addAsset(asset: Omit<SiteAsset, 'id' | 'uploadedAt'>): Promise<void>;
  deleteAsset(id: string): Promise<void>;
  listAudit(): Promise<DataEnvelope<AuditEvent[]>>;
}

export class DataUnavailableError extends Error {
  readonly code = 'DATA_SOURCE_NOT_CONNECTED';
  constructor(message: string) {
    super(message);
    this.name = 'DataUnavailableError';
  }
}
