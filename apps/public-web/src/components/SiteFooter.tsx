import { Wordmark, cn, containerClass } from '@agrabudi/ui';
import Link from 'next/link';
import { channelHref } from '@/components/company';
import { officialChannels } from '@/lib/contact';
import { appUrls } from '@/lib/env';

const columns = [
  {
    title: 'Perusahaan',
    links: [
      { label: 'Tentang Kami', href: '/tentang' },
      { label: 'Area layanan', href: '/tentang/area' },
      { label: 'Lokasi kantor', href: '/tentang/kantor' },
      { label: 'Hubungi Kami', href: '/kontak' },
      { label: 'Karir', href: '/karir' },
    ],
  },
  {
    title: 'Layanan',
    links: [
      { label: 'Produk', href: '/produk' },
      { label: 'IndiHome', href: '/indihome' },
      { label: 'Promo & Program', href: '/promo' },
      { label: 'Daftar Digipos', href: '/digipos' },
    ],
  },
];

const linkClass =
  'inline-flex min-h-11 items-center text-sm text-ink-300 hover:text-white tablet:min-h-8';

/** Footer dengan kanal kontak resmi. Alamat kantor ada di halaman Lokasi kantor. */
export function SiteFooter() {
  return (
    <footer className="on-dark bg-ink-900 text-white">
      <div
        className={cn(
          containerClass,
          'grid gap-8 py-10 tablet:grid-cols-2 desktop:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)]',
        )}
      >
        <div>
          <Wordmark tone="dark" />
          <p className="mt-3 text-sm text-ink-300">PT Agrabudi Komunika</p>
        </div>
        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="text-sm font-bold">{column.title}</h2>
            <ul className="mt-2 flex flex-col">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <nav aria-label="Aplikasi lain">
          <h2 className="text-sm font-bold">Mitra dan karyawan</h2>
          <ul className="mt-2 flex flex-col">
            <li>
              <a href={appUrls.outlet} className={linkClass}>
                Aplikasi Outlet
              </a>
            </li>
            <li>
              <a href={appUrls.portal} className={linkClass}>
                Portal karyawan
              </a>
            </li>
          </ul>
        </nav>
        <nav aria-label="Kontak resmi">
          <h2 className="text-sm font-bold">Hubungi kami</h2>
          <ul className="mt-2 flex flex-col">
            {officialChannels.map((channel) => {
              const href = channelHref(channel);
              return (
                <li key={channel.kind}>
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      {channel.label}: {channel.value}
                    </a>
                  ) : (
                    <span className={linkClass}>
                      {channel.label}: {channel.value}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      <div className="border-t border-ink-700">
        <p className={cn(containerClass, 'py-4 text-xs text-ink-300')}>
          © 2026 PT Agrabudi Komunika
        </p>
      </div>
    </footer>
  );
}
