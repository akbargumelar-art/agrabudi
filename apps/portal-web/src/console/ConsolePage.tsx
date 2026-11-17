import type { ComponentType } from 'react';
import { BannersPage } from './BannersPage';
import { DashboardPage, PagesPage, PublicationsPage } from './ContentPages';
import { AssetsPage, AuditPage, LayoutsPage, NavigationPage, PreviewPage } from './SettingsPages';

/** Halaman tiap menu Website, menurut slug di route registry. */
export const consolePages: Record<string, ComponentType> = {
  dashboard: DashboardPage,
  pages: PagesPage,
  banners: BannersPage,
  navigation: NavigationPage,
  layouts: LayoutsPage,
  assets: AssetsPage,
  preview: PreviewPage,
  publications: PublicationsPage,
  audit: AuditPage,
};
