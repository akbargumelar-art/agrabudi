import { EmptyState, ToastProvider, buttonClass } from '@agrabudi/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Link, Route, Routes } from 'react-router';
import { PortalLayout } from './app/PortalLayout';
import { LoginPage } from './auth/LoginPage';
import { RequireSession } from './auth/RequireSession';
import { SessionProvider } from './auth/SessionContext';
import { AccountPage } from './features/account/AccountPages';
import { ActivityPage, DashboardPage, ReportsPage } from './features/home/OverviewPages';
import { AllMenuPage } from './features/menu/AllMenuPage';
import { ModulePage } from './features/module/ModulePage';
import { sections } from './registry';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

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
 * Route Portal operasional (PRD 4.3). Halaman pertama adalah login; semua halaman lain
 * berada di balik sesi dan menunya mengikuti peran, termasuk pengaturan website di /web-admin
 * untuk peran Admin Web.
 */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <SessionProvider>
          <Routes>
            <Route path="login" element={<LoginPage />} />
            <Route element={<RequireSession />}>
              <Route element={<PortalLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="aktivitas" element={<ActivityPage />} />
                <Route path="laporan" element={<ReportsPage />} />
                <Route path="menu" element={<AllMenuPage />} />
                <Route path="akun" element={<AccountPage />} />
                {sections.map((section) => (
                  <Route
                    key={section.id}
                    path={`${section.prefix.slice(1)}/*`}
                    element={<ModulePage />}
                  />
                ))}
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>
          </Routes>
        </SessionProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
