'use client';

import { AppSwitcher, MainNav, Wordmark, buttonClass, cn, type NavItem } from '@agrabudi/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { appUrls } from '@/lib/env';
import { NextLink } from './NextLink';

/** Menu utama Publik (PRD 2.2). Karir bagian dari Publik, bukan aplikasi tingkat 1. */
const mainItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Tentang Kami', href: '/tentang', alsoActiveOn: ['/kontak'] },
  { label: 'Produk', href: '/produk' },
  { label: 'IndiHome', href: '/indihome' },
  { label: 'Promo & Program', href: '/promo' },
  { label: 'Daftar Digipos', href: '/digipos' },
  { label: 'Karir', href: '/karir' },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <>
      <AppSwitcher active="public" urls={appUrls} />
      <MainNav
        brand={
          <Link
            href="/"
            aria-label="Agrabudi Komunika, ke Home"
            className="inline-flex min-h-11 items-center"
          >
            <Wordmark />
          </Link>
        }
        items={mainItems}
        currentPath={pathname}
        LinkComponent={NextLink}
        actions={
          <Link
            href="/kontak"
            className={cn(
              buttonClass({ variant: 'secondary', size: 'sm' }),
              'tablet:hidden desktop:inline-flex',
            )}
          >
            Hubungi Kami
          </Link>
        }
      />
    </>
  );
}
