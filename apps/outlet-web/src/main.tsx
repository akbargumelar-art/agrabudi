import { ToastProvider } from '@agrabudi/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import { SessionProvider } from './auth/SessionContext';
import { CartProvider } from './features/abkshop/CartContext';
import './styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    // Gagal ditampilkan apa adanya. Percobaan ulang dipicu pengguna lewat tombol "Coba lagi".
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

const root = document.getElementById('root');
if (!root) throw new Error('Elemen #root tidak ditemukan.');

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <SessionProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </SessionProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
