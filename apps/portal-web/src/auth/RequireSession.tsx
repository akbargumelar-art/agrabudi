import { Navigate, Outlet, useLocation } from 'react-router';
import { useSessionApi } from './SessionContext';

/** Semua halaman Portal berada di balik login. Belum masuk berarti dialihkan ke /login. */
export function RequireSession() {
  const { session, leftVoluntarily } = useSessionApi();
  const location = useLocation();
  if (!session) {
    // Halaman asal hanya diingat bila pengguna datang tanpa sesi, bukan setelah menekan Keluar.
    return (
      <Navigate to="/login" replace state={leftVoluntarily ? null : { from: location.pathname }} />
    );
  }
  return <Outlet />;
}
