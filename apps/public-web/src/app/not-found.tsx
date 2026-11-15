import { EmptyState, buttonClass, cn, containerClass } from '@agrabudi/ui';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className={cn(containerClass, 'py-12')}>
      <EmptyState
        title="Halaman tidak ditemukan"
        description="Alamat yang Anda buka tidak ada atau sudah dipindahkan."
        action={
          <Link href="/" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
            Ke Home
          </Link>
        }
      />
    </div>
  );
}
