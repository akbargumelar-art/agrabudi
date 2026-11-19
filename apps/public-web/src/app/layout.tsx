import { MockRibbon, bottomNavOffsetClass, cn, logoMark } from '@agrabudi/ui';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { SiteBottomNav } from '@/components/SiteBottomNav';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { usesMockData } from '@/lib/env';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Agrabudi Komunika', template: '%s | Agrabudi Komunika' },
  description:
    'Website PT Agrabudi Komunika: produk Telkomsel, layanan IndiHome, program, dan karir.',
  // Tahap kerangka: isi masih data contoh, jadi belum boleh diindeks mesin pencari.
  robots: { index: false, follow: false },
  icons: { icon: logoMark.src },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/**
 * Body berupa kolom setinggi layar dan `main` mengisi sisa ruang, sehingga footer
 * tetap di dasar layar walau isi halaman pendek (mis. daftar kosong).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body className="flex min-h-dvh flex-col">
        <a
          href="#konten"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-control focus:bg-surface-0 focus:px-3 focus:py-2"
        >
          Lewati ke isi
        </a>
        <SiteHeader />
        {usesMockData ? <MockRibbon /> : null}
        <div className={cn('flex flex-1 flex-col', bottomNavOffsetClass)}>
          <main id="konten" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </div>
        <SiteBottomNav />
      </body>
    </html>
  );
}
