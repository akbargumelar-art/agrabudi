import { siteSettingsSchema } from '@agrabudi/contracts';
import {
  AsyncView,
  Button,
  DataNotice,
  ErrorState,
  Field,
  Input,
  PageHeader,
  useToast,
} from '@agrabudi/ui';
import { useState, type FormEvent } from 'react';
import { useSiteSettings, useUpdateSiteSettings } from './data/queries';

/**
 * Alamat halaman pemesanan yang disematkan di menu ABKShop aplikasi Outlet.
 * Hanya https di domain Agrabudi yang diterima, supaya halaman pihak lain tidak bisa
 * ditampilkan di dalam aplikasi Outlet.
 */
export function AbkShopSettingsPage() {
  const settings = useSiteSettings();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Halaman ABKShop"
        description="Alamat halaman pemesanan yang tampil di menu ABKShop aplikasi Outlet."
        aside={settings.data ? <DataNotice meta={settings.data.meta} /> : null}
      />
      <AsyncView
        state={settings}
        errorTitle="Pengaturan tidak dapat dimuat"
        loadingLabel="Memuat pengaturan"
      >
        {(envelope) => <SettingsForm current={envelope.data.abkshopEmbedUrl} />}
      </AsyncView>
    </div>
  );
}

function SettingsForm({ current }: { current: string }) {
  const update = useUpdateSiteSettings();
  const toast = useToast();
  const [value, setValue] = useState(current);
  const [fieldError, setFieldError] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = siteSettingsSchema.safeParse({ abkshopEmbedUrl: value.trim() });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Alamat belum benar.');
      return;
    }
    setFieldError(null);
    update.mutate(parsed.data, {
      onSuccess: () => toast.show({ tone: 'success', message: 'Alamat ABKShop disimpan.' }),
    });
  }

  return (
    <form className="flex max-w-2xl flex-col gap-4" onSubmit={onSubmit} noValidate>
      <Field
        label="Alamat halaman pemesanan"
        htmlFor="abkshop-url"
        hint="Harus diawali https dan berada di domain agrabudi.com atau agrabudi.id."
        error={fieldError ?? undefined}
      >
        <Input
          id="abkshop-url"
          name="abkshopEmbedUrl"
          type="url"
          inputMode="url"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-invalid={fieldError !== null}
          aria-describedby={fieldError ? 'abkshop-url-error' : 'abkshop-url-hint'}
        />
      </Field>
      {update.isError ? (
        <ErrorState
          title="Alamat belum tersimpan"
          description={
            update.error instanceof Error ? update.error.message : 'Coba lagi beberapa saat.'
          }
        />
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={update.isPending || value.trim() === current}>
          Simpan alamat
        </Button>
        <p className="text-sm text-ink-700">
          Alamat aktif:{' '}
          <span data-testid="abkshop-url-aktif" className="font-medium text-ink-900">
            {current}
          </span>
        </p>
      </div>
      <p className="max-w-prose text-sm text-ink-700">
        Di tahap kerangka, perubahan ini belum sampai ke aplikasi Outlet karena keduanya belum
        terhubung ke server yang sama.
      </p>
    </form>
  );
}
