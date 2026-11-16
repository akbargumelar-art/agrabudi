import { AppSwitcher, BottomNav, Drawer, Wordmark, cn, logoMark, type BottomNavItem } from '@agrabudi/ui';
import { Activity, ChartColumn, House, LayoutGrid, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { useSession, useSessionApi } from '../auth/SessionContext';
import { appUrls } from './env';
import { RouterLink } from './RouterLink';
import { Sidebar } from './Sidebar';
import { StageNotice } from './StageNotice';

const SIDEBAR_KEY = 'abk-portal-sidebar-ciut-v1';

/** Pilihan terakhir pengguna; bila belum ada, sidebar terbuka di desktop dan ciut di tablet. */
function initialCollapsed(): boolean {
  try {
    const stored = window.localStorage.getItem(SIDEBAR_KEY);
    if (stored === '1') return true;
    if (stored === '0') return false;
  } catch {
    // Penyimpanan tidak tersedia: pakai bawaan menurut lebar layar.
  }
  return window.innerWidth < 1200;
}

/**
 * Kerangka Portal setelah masuk. Di tablet dan desktop semua navigasi ada di sidebar:
 * Dashboard, modul sesuai peran, Akun, dan Keluar. Di HP ada menu bawah melayang;
 * item Menu membuka sidebar yang sama dari kiri.
 */
export function PortalLayout() {
  const { pathname } = useLocation();
  const session = useSession();
  const { signOut } = useSessionApi();
  const mainRef = useRef<HTMLElement>(null);
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setDrawerOpen(false);
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  function toggleSidebar() {
    setCollapsed((value) => {
      const next = !value;
      try {
        window.localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0');
      } catch {
        // Penyimpanan tidak tersedia: pilihan berlaku sampai halaman ditutup.
      }
      return next;
    });
  }

  const bottomItems: BottomNavItem[] = [
    { label: 'Beranda', href: '/', icon: House },
    ...(session.role !== 'web_admin'
      ? [
          { label: 'Aktivitas', href: '/aktivitas', icon: Activity },
          { label: 'Laporan', href: '/laporan', icon: ChartColumn },
        ]
      : []),
    { label: 'Menu', icon: LayoutGrid, onPress: () => setDrawerOpen(true), expanded: drawerOpen },
    { label: 'Akun', href: '/akun', icon: UserRound },
  ];

  const brand = (
    <Link to="/" aria-label="Agrabudi Portal, ke Dashboard" className="inline-flex min-h-11 items-center">
      <Wordmark app="Portal" />
    </Link>
  );

  return (
    <>
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-control focus:bg-surface-0 focus:px-3 focus:py-2"
      >
        Lewati ke isi
      </a>
      <AppSwitcher active="portal" urls={appUrls} />
      <header className="sticky top-0 z-40 flex items-center border-b border-surface-100 bg-surface-0/95 px-4 py-1.5 backdrop-blur tablet:hidden">
        {brand}
      </header>
      <StageNotice />
      <div
        className={cn(
          'mx-auto w-full max-w-[90rem] px-4 tablet:grid tablet:gap-6 tablet:px-6',
          collapsed
            ? 'tablet:grid-cols-[2.75rem_minmax(0,1fr)]'
            : 'tablet:grid-cols-[17.5rem_minmax(0,1fr)]',
        )}
      >
        <aside className="hidden py-4 tablet:block">
          <div className="sticky top-4 flex max-h-[calc(100dvh-2rem)] flex-col gap-3 overflow-y-auto">
            {collapsed ? (
              <Link
                to="/"
                aria-label="Agrabudi Portal, ke Dashboard"
                className="inline-flex size-11 items-center justify-center"
              >
                <img src={logoMark.src} alt="" width={logoMark.width} height={logoMark.height} className="size-8" />
              </Link>
            ) : (
              <div className="px-1">{brand}</div>
            )}
            <Sidebar
              pathname={pathname}
              session={session}
              collapsed={collapsed}
              onToggle={toggleSidebar}
              onSignOut={signOut}
            />
          </div>
        </aside>
        <main id="konten" ref={mainRef} tabIndex={-1} className="min-w-0 pt-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))] outline-none tablet:pb-6">
          <Outlet />
        </main>
      </div>
      <BottomNav
        floating
        items={bottomItems}
        currentPath={pathname}
        LinkComponent={RouterLink}
        label="Menu Portal"
      />
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Menu" side="left">
        <Sidebar pathname={pathname} session={session} collapsed={false} onSignOut={signOut} />
      </Drawer>
    </>
  );
}
