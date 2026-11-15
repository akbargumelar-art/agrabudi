import type { ReactNode } from 'react';
import { Button } from './Button';
import { ErrorState, LoadingBlock } from './States';

type AsyncState<T> = {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  data: T | undefined;
  refetch?: () => unknown;
};

type AsyncViewProps<T> = {
  /** Hasil query (bentuknya cocok dengan TanStack Query, tanpa bergantung padanya). */
  state: AsyncState<T>;
  errorTitle?: string;
  loadingLabel?: string;
  children: (data: T) => ReactNode;
};

/**
 * Satu pola untuk loading dan gagal. Gagal ditampilkan sebagai gagal,
 * tidak pernah diganti data contoh (PRD 3.3).
 */
export function AsyncView<T>({
  state,
  errorTitle = 'Data tidak dapat dimuat',
  loadingLabel,
  children,
}: AsyncViewProps<T>) {
  if (state.isPending) return <LoadingBlock label={loadingLabel} />;
  if (state.isError || state.data === undefined) {
    const description =
      state.error instanceof Error
        ? state.error.message
        : 'Terjadi gangguan saat mengambil data. Coba lagi beberapa saat.';
    return (
      <ErrorState
        title={errorTitle}
        description={description}
        action={
          state.refetch ? (
            <Button variant="secondary" size="sm" onClick={() => void state.refetch?.()}>
              Coba lagi
            </Button>
          ) : undefined
        }
      />
    );
  }
  return <>{children(state.data)}</>;
}
