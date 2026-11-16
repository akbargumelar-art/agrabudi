import { isAllowedEmbedUrl } from '@agrabudi/contracts';
import { AsyncView, ErrorState, PageHeader, buttonClass } from '@agrabudi/ui';
import { ExternalLink } from 'lucide-react';
import { useSiteSettings } from '../../data/queries';

/**
 * ABKShop menyematkan halaman pemesanan terpisah. Alamatnya diatur Admin Web dan
 * diperiksa lagi di sini: hanya https di domain Agrabudi yang boleh tampil.
 */
export function AbkShopPage() {
  const settings = useSiteSettings();
  return (
    <div className="flex flex-col gap-4">
      <AsyncView
        state={settings}
        errorTitle="Halaman ABKShop tidak dapat dimuat"
        loadingLabel="Menyiapkan ABKShop"
      >
        {(envelope) => {
          const url = envelope.data.abkshopEmbedUrl;
          if (!isAllowedEmbedUrl(url)) {
            return (
              <>
                <PageHeader title="ABKShop" />
                <ErrorState
                  title="Alamat ABKShop tidak dapat dipakai"
                  description="Alamat halaman pemesanan harus https dan berada di domain Agrabudi. Hubungi Admin Web untuk memperbaikinya."
                />
              </>
            );
          }
          return (
            <>
              <PageHeader
                title="ABKShop"
                description="Pesan paket untuk outlet Anda. Verifikasi outlet dilakukan di halaman pemesanan."
                aside={
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonClass({ variant: 'secondary', size: 'sm' })}
                  >
                    Buka di tab baru
                    <ExternalLink aria-hidden className="size-4" />
                  </a>
                }
              />
              <div className="overflow-hidden rounded-panel border border-surface-100 bg-surface-50">
                <iframe
                  title="Halaman pemesanan ABKShop"
                  src={url}
                  data-testid="abkshop-embed"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
                  className="block h-[75dvh] min-h-120 w-full border-0"
                />
              </div>
              <p className="text-sm text-ink-700">
                Halaman pemesanan tidak tampil di sini? Pakai tombol Buka di tab baru.
              </p>
            </>
          );
        }}
      </AsyncView>
    </div>
  );
}
