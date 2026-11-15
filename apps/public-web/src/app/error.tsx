'use client';

import { Button, ErrorState, cn, containerClass } from '@agrabudi/ui';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className={cn(containerClass, 'py-12')}>
      <ErrorState
        title="Halaman tidak dapat ditampilkan"
        description="Terjadi gangguan saat menyiapkan halaman ini. Coba lagi beberapa saat."
        requestId={error.digest}
        action={
          <Button variant="secondary" size="sm" onClick={reset}>
            Coba lagi
          </Button>
        }
      />
    </div>
  );
}
