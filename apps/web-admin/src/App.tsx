import { EmptyState, buttonClass } from '@agrabudi/ui';
import { Link, Route, Routes } from 'react-router';
import { ConsoleLayout } from './app/ConsoleLayout';
import { BannersPage, DashboardPage, PagesPage, PublicationsPage } from './features/ContentPages';
import {
  AssetsPage,
  AuditPage,
  LayoutsPage,
  LoginPage,
  NavigationPage,
  PreviewPage,
} from './features/SkeletonPages';

function NotFoundPage() {
  return (
    <EmptyState
      title="Halaman tidak ditemukan"
      description="Alamat yang Anda buka tidak ada di console."
      action={
        <Link to="/" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
          Ke Dashboard Website
        </Link>
      }
    />
  );
}

/** Route console mengikuti PRD 2.3. Semua path relatif terhadap /web-admin. */
export function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<ConsoleLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="pages" element={<PagesPage />} />
        <Route path="banners" element={<BannersPage />} />
        <Route path="navigation" element={<NavigationPage />} />
        <Route path="layouts" element={<LayoutsPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="preview" element={<PreviewPage />} />
        <Route path="publications" element={<PublicationsPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
