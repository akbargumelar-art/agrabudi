import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
  /** Isi tambahan di kanan judul, misalnya label data contoh atau tombol aksi. */
  aside?: ReactNode;
};

export function PageHeader({ title, description, aside }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold text-ink-900 tablet:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-prose text-sm text-ink-700">{description}</p>
        ) : null}
      </div>
      {aside}
    </div>
  );
}
