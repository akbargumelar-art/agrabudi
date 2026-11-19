import { LoadingBlock } from '@agrabudi/ui';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useSessionApi } from './SessionContext';

/** Semua halaman Portal berada di balik login. Belum masuk berarti dialihkan ke /login. */
export function RequireSession() {
  const { session, status, leftVoluntarily } = useSessionApi();
  const location = useLocation();
  if (!session && status === 'checking') {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <LoadingBlock label="Memeriksa sesi" />
      </main>
    );
  }
  if (!session) {
    // Halaman asal hanya diingat bila pengguna datang tanpa sesi, bukan setelah menekan Keluar.
    return (
      <Navigate to="/login" replace state={leftVoluntarily ? null : { from: location.pathname }} />
    );
  }
  // Kata sandi sementara: server menolak API lain sampai diganti, jadi langsung ke halaman ganti.
  if (session.mustChangePassword) return <Navigate to="/ganti-kata-sandi" replace />;
  return <Outlet />;
}
