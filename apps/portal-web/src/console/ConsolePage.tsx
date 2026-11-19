import type { ComponentType } from 'react';
import { BannersPage } from './BannersPage';
import { ChannelsEditorPage } from './ChannelsPage';
import { AboutEditorPage, AreasEditorPage } from './CompanyPages';
import { DashboardPage, PagesPage, PublicationsPage } from './ContentPages';
import { DigiposInfoPage } from './DigiposInfoPage';
import { OfficesEditorPage } from './OfficesPage';
import { AssetsPage, AuditPage, LayoutsPage, NavigationPage, PreviewPage } from './SettingsPages';
import { WaGatewayPage } from './WaGatewayPage';

/** Halaman tiap menu Website, menurut slug di route registry. */
export const consolePages: Record<string, ComponentType> = {
  dashboard: DashboardPage,
  pages: PagesPage,
  'tentang-kami': AboutEditorPage,
  'area-layanan': AreasEditorPage,
  'lokasi-kantor': OfficesEditorPage,
  'hubungi-kami': ChannelsEditorPage,
  'daftar-digipos': DigiposInfoPage,
  'wa-gateway': WaGatewayPage,
  banners: BannersPage,
  navigation: NavigationPage,
  layouts: LayoutsPage,
  assets: AssetsPage,
  preview: PreviewPage,
  publications: PublicationsPage,
  audit: AuditPage,
};
