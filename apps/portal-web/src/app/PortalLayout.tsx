import {
  AppSwitcher,
  BottomNav,
  MainNav,
  Wordmark,
  bottomNavOffsetClass,
  cn,
  containerClass,
  type BottomNavItem,
  type NavItem,
} from '@agrabudi/ui';
import { Activity, ChartColumn, House, LayoutGrid, UserRound } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { sections } from '../registry';
import { appUrls } from './env';
import { RouterLink } from './RouterLink';
import { Sidebar } from './Sidebar';
import { StageNotice } from './StageNotice';

const modulePrefixes = sections.map((section) => section.prefix);

/** Menu utama Portal (PRD 2.2). Modul rinci lewat sidebar atau "Semua Menu". */
const mainItems: NavItem[] = [
  { label: 'Dashboard', href: '/' },
  { label: 'Aktivitas', href: '/aktivitas' },
  { label: 'Laporan', href: '/laporan' },
  { label: 'Semua Menu', href: '/menu', alsoActiveOn: modulePrefixes },
  { label: 'Akun', href: '/akun', alsoActiveOn: ['/login'] },
];

/** Bottom navigation Portal (PRD 2.2). */
const bottomItems: BottomNavItem[] = [
  { label: 'Beranda', href: '/', icon: House },
  { label: 'Aktivitas', href: '/aktivitas', icon: Activity },
  { label: 'Laporan', href: '/laporan', icon: ChartColumn },
  { label: 'Lainnya', href: '/menu', alsoActiveOn: modulePrefixes, icon: LayoutGrid },
  { label: 'Akun', href: '/akun', alsoActiveOn: ['/login'], icon: UserRound },
];

export function PortalLayout() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <>
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-control focus:bg-surface-0 focus:px-3 focus:py-2"
      >
        Lewati ke isi
      </a>
      <AppSwitcher active="portal" urls={appUrls} />
      <MainNav
        brand={
          <Link
            to="/"
            aria-label="Agrabudi Portal, ke Dashboard"
            className="inline-flex min-h-11 items-center"
          >
            <Wordmark app="Portal" />
          </Link>
        }
        items={mainItems}
        currentPath={pathname}
        LinkComponent={RouterLink}
      />
      <StageNotice />
      <div
        className={cn(
          containerClass,
          'desktop:grid desktop:grid-cols-[17rem_minmax(0,1fr)] desktop:gap-8',
        )}
      >
        <aside className="hidden py-6 desktop:block">
          <Sidebar pathname={pathname} />
        </aside>
        <main
          id="konten"
          ref={mainRef}
          tabIndex={-1}
          className={cn('min-w-0 py-6 outline-none', bottomNavOffsetClass)}
        >
          <Outlet />
        </main>
      </div>
      <BottomNav items={bottomItems} currentPath={pathname} LinkComponent={RouterLink} />
    </>
  );
}
