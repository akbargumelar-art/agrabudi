import type { DataEnvelope } from '@agrabudi/contracts';
import { AsyncView, Button, DataNotice, PageHeader, useToast } from '@agrabudi/ui';
import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import type { z } from 'zod';

type QueryState<T> = {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  data: DataEnvelope<T | null> | undefined;
  refetch?: () => unknown;
};
type SaveState<T> = {
  isPending: boolean;
  mutate: (value: T, options: { onSuccess: () => void; onError: (error: Error) => void }) => void;
};

/** Pesan galat per kolom dari ZodError, dengan path bertitik (mis. `offices.0.name`). */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) result[issue.path.join('.') || '_'] ??= issue.message;
  return result;
}

/**
 * Kerangka satu editor dokumen: muat, ubah salinan lokal, validasi dengan skema kontrak,
 * simpan. Dokumen yang belum pernah diisi tampil kosong dengan keterangan, bukan isi rekaan.
 * Sukses hanya diumumkan setelah server menerima (AS-09).
 */
export function DocumentEditor<T>({
  title,
  description,
  query,
  save,
  schema,
  empty,
  normalize = (value) => value,
  publicPath,
  children,
}: {
  title: string;
  description: string;
  query: QueryState<T>;
  save: SaveState<T>;
  schema: z.ZodType<T>;
  empty: T;
  /** Rapikan isian sebelum validasi, mis. buang baris kosong. */
  normalize?: (draft: T) => T;
  /** Halaman Publik yang menampilkan isi ini. */
  publicPath: string;
  children: (draft: T, setDraft: (next: T) => void, errors: Record<string, string>) => ReactNode;
}) {
  const toast = useToast();
  const formId = useId();
  const [draft, setDraft] = useState<T | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const loaded = query.data;
  useEffect(() => {
    if (loaded) setDraft(loaded.data ?? empty);
  }, [loaded, empty]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (draft === null) return;
    const parsed = schema.safeParse(normalize(draft));
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    save.mutate(parsed.data, {
      onSuccess: () =>
        toast.show({ tone: 'success', message: `${title} disimpan dan tampil di website.` }),
      onError: (error) =>
        toast.show({ tone: 'danger', message: `Gagal menyimpan. ${error.message}` }),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={title}
        description={description}
        aside={loaded ? <DataNotice meta={loaded.meta} /> : null}
      />
      <AsyncView
        state={query}
        errorTitle={`${title} tidak dapat dimuat`}
        loadingLabel={`Memuat ${title}`}
      >
        {(envelope) => (
          <form id={formId} noValidate onSubmit={submit} className="flex flex-col gap-6">
            {envelope.data === null ? (
              <p className="max-w-prose text-sm text-ink-700">
                Belum pernah diisi. Halaman {publicPath} di website Publik menampilkan &quot;belum
                diterbitkan&quot; sampai isi ini disimpan.
              </p>
            ) : null}
            {draft !== null ? children(draft, setDraft, errors) : null}
            {Object.keys(errors).length > 0 ? (
              <p role="alert" className="text-sm font-medium text-danger">
                Periksa kembali isian yang ditandai.
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={draft === null || save.isPending}>
                {save.isPending ? 'Menyimpan…' : 'Simpan dan terbitkan'}
              </Button>
              <span className="text-sm text-ink-700">Tampil di {publicPath} setelah disimpan.</span>
            </div>
          </form>
        )}
      </AsyncView>
    </div>
  );
}
