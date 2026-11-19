import type { OutletSession } from '@agrabudi/contracts';
import { LoadingBlock, PageHeader, buttonClass, cardClass, cn } from '@agrabudi/ui';
import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { useOutletSession } from './SessionContext';

type RequireOutletProps = {
  /** Judul halaman yang tetap tampil saat belum masuk, supaya pengguna tahu di mana ia berada. */
  title: string;
  /** Kalimat mengapa halaman ini butuh login. */
  reason: string;
  children: (session: OutletSession) => ReactNode;
};

/**
 * Halaman khusus mitra terverifikasi: katalog harga outlet, checkout, dan pesanan sendiri
 * (PRD 2.1, 4.6). Belum masuk berarti diminta login, lalu kembali ke halaman ini.
 * Ini hanya pintu tampilan; server tetap memeriksa sesi pada setiap permintaan.
 */
export function RequireOutlet({ title, reason, children }: RequireOutletProps) {
  const { session, status } = useOutletSession();
  const { pathname } = useLocation();
  // Kata sandi sementara: server menolak katalog dan order sampai diganti.
  if (session?.mustChangePassword) return <Navigate to="/ganti-kata-sandi" replace />;
  if (session) return <>{children(session)}</>;
  if (status === 'checking') return <LoadingBlock label="Memeriksa sesi" />;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} />
      <div className={cn(cardClass, 'flex flex-col items-start gap-3 p-6')}>
        <p className="font-semibold">Masuk dulu untuk melanjutkan</p>
        <p className="text-sm text-ink-700">{reason}</p>
        <Link to="/login" state={{ from: pathname }} className={buttonClass({ size: 'sm' })}>
          Masuk dengan ID Digipos
        </Link>
      </div>
    </div>
  );
}
