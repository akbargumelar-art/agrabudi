import { Route, Routes } from 'react-router';
import { NotFoundPage } from './app/NotFoundPage';
import { OutletLayout } from './app/OutletLayout';
import { AbkShopPage } from './features/abkshop/AbkShopPage';
import { AccountPage, LoginPage } from './features/account/AccountPages';
import { ForceChangePasswordPage, RecoverAccessPage } from './features/account/PasswordPages';
import { CalculatorPage } from './features/calculator/CalculatorPage';
import { CheckoutPage } from './features/checkout/CheckoutPage';
import { HomePage } from './features/home/HomePage';
import { OrderDetailPage } from './features/orders/OrderDetailPage';
import { OrdersPage } from './features/orders/OrdersPage';
import { ProgramDetailPage } from './features/programs/ProgramDetailPage';
import { ProgramsPage } from './features/programs/ProgramsPage';

/**
 * Route Outlet (PRD 2.7). ABKShop, Checkout, dan Pesanan hanya untuk mitra yang sudah masuk.
 */
export function App() {
  return (
    <Routes>
      <Route element={<OutletLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="lupa-akses" element={<RecoverAccessPage />} />
        <Route path="ganti-kata-sandi" element={<ForceChangePasswordPage />} />
        <Route path="kalkulator" element={<CalculatorPage />} />
        <Route path="abkshop" element={<AbkShopPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="pesanan" element={<OrdersPage />} />
        <Route path="pesanan/:id" element={<OrderDetailPage />} />
        <Route path="program" element={<ProgramsPage />} />
        <Route path="program/:slug" element={<ProgramDetailPage />} />
        <Route path="akun" element={<AccountPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
