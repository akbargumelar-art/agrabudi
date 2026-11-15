import { EmptyState, buttonClass } from '@agrabudi/ui';
import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <EmptyState
      title="Halaman tidak ditemukan"
      description="Alamat yang Anda buka tidak ada di aplikasi Outlet."
      action={
        <Link to="/" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
          Ke Home
        </Link>
      }
    />
  );
}
