import type {
  CompanyProfileSection,
  CompanySectionData,
  ContentStatus,
  DataEnvelope,
  DigiposInfo,
  PublicationRecord,
  SiteBanner,
  SitePage,
  WaGatewayStatus,
  WaNotificationSettings,
} from '@agrabudi/contracts';
import type { AuditEvent, LayoutSection, NavItem, SiteAsset } from './types';

/** Grup WA yang bisa dikirimi pesan uji. */
export type WaTestTarget = 'orderGroup' | 'careerGroup' | 'digiposGroup';

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
  listNavigation(): Promise<DataEnvelope<NavItem[]>>;
  saveNavigation(items: NavItem[]): Promise<void>;
  listLayouts(): Promise<DataEnvelope<LayoutSection[]>>;
  saveLayouts(items: LayoutSection[]): Promise<void>;
  listAssets(): Promise<DataEnvelope<SiteAsset[]>>;
  addAsset(asset: Omit<SiteAsset, 'id' | 'uploadedAt'>): Promise<void>;
  deleteAsset(id: string): Promise<void>;
  listAudit(): Promise<DataEnvelope<AuditEvent[]>>;
  /** `data: null` = bagian profil belum pernah diisi. */
  getCompanySection<K extends CompanyProfileSection>(
    section: K,
  ): Promise<DataEnvelope<CompanySectionData<K> | null>>;
  saveCompanySection<K extends CompanyProfileSection>(
    section: K,
    data: CompanySectionData<K>,
  ): Promise<void>;
  getDigiposInfo(): Promise<DataEnvelope<DigiposInfo | null>>;
  saveDigiposInfo(info: DigiposInfo): Promise<void>;
  getWaGateway(): Promise<DataEnvelope<WaGatewayStatus>>;
  saveWaGateway(settings: WaNotificationSettings): Promise<void>;
  /** Gagal kirim = Error; tidak pernah dianggap berhasil. */
  testWaGateway(target: WaTestTarget): Promise<void>;
}

export class DataUnavailableError extends Error {
  readonly code = 'DATA_SOURCE_NOT_CONNECTED';
  constructor(message: string) {
    super(message);
    this.name = 'DataUnavailableError';
  }
}
