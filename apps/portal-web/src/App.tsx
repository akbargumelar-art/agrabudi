import { EmptyState, buttonClass } from '@agrabudi/ui';
import { Link, Route, Routes } from 'react-router';
import { PortalLayout } from './app/PortalLayout';
import { AccountPage, LoginPage } from './features/account/AccountPages';
import { ActivityPage, DashboardPage, ReportsPage } from './features/home/OverviewPages';
import { AllMenuPage } from './features/menu/AllMenuPage';
import { ModulePage } from './features/module/ModulePage';
import { sections } from './registry';

function NotFoundPage() {
  return (
    <EmptyState
      title="Halaman tidak ditemukan"
      description="Alamat yang Anda buka tidak ada di Portal."
      action={
        <Link to="/" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
          Ke Dashboard
        </Link>
      }
    />
  );
}

/**
 * Route Portal operasional (PRD 4.3). Modul di bawah /telkomsel, /indihome, dan /admin
 * dicocokkan lewat route registry. /web-admin bukan bagian dari bundle ini.
 */
export function App() {
  return (
    <Routes>
      <Route element={<PortalLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="aktivitas" element={<ActivityPage />} />
        <Route path="laporan" element={<ReportsPage />} />
        <Route path="menu" element={<AllMenuPage />} />
        <Route path="akun" element={<AccountPage />} />
        <Route path="login" element={<LoginPage />} />
        {sections.map((section) => (
          <Route key={section.id} path={`${section.prefix.slice(1)}/*`} element={<ModulePage />} />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
