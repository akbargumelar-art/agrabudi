import { Route, Routes } from 'react-router';
import { NotFoundPage } from './app/NotFoundPage';
import { OutletLayout } from './app/OutletLayout';
import { AbkShopPage } from './features/abkshop/AbkShopPage';
import { AccountPage, LoginPage, RecoverAccessPage } from './features/account/AccountPages';
import { CalculatorPage } from './features/calculator/CalculatorPage';
import { HomePage } from './features/home/HomePage';
import { ProgramDetailPage } from './features/programs/ProgramDetailPage';
import { ProgramsPage } from './features/programs/ProgramsPage';

/**
 * Route Outlet. Checkout dan Pesanan dari PRD 2.7 tidak ada untuk sekarang: pemesanan
 * dilakukan di halaman ABKShop yang disematkan (keputusan Abay, 15 Nov 2026).
 */
export function App() {
  return (
    <Routes>
      <Route element={<OutletLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="lupa-akses" element={<RecoverAccessPage />} />
        <Route path="kalkulator" element={<CalculatorPage />} />
        <Route path="abkshop" element={<AbkShopPage />} />
        <Route path="program" element={<ProgramsPage />} />
        <Route path="program/:slug" element={<ProgramDetailPage />} />
        <Route path="akun" element={<AccountPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
