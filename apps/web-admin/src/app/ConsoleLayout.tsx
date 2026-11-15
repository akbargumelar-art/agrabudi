import {
  BottomNav,
  Drawer,
  MockRibbon,
  bottomNavOffsetClass,
  cn,
  isNavItemActive,
  type BottomNavItem,
  type NavItem,
} from '@agrabudi/ui';
import { Ellipsis, FileText, History, Images, LayoutDashboard } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { appUrls, usesMockData } from './env';
import { RouterLink } from './RouterLink';

type MenuGroup = { heading?: string; items: NavItem[] };

/** Menu console (PRD 2.2, 2.3). Tidak ada menu operasional di sini. */
const menu: MenuGroup[] = [
  {
    items: [
      { label: 'Dashboard Website', href: '/', match: 'exact' },
      { label: 'Halaman Perusahaan', href: '/pages' },
      { label: 'Banner', href: '/banners' },
    ],
  },
  {
    heading: 'Navigasi & Layout',
    items: [
      { label: 'Navigasi', href: '/navigation' },
      { label: 'Layout', href: '/layouts' },
    ],
  },
  { items: [{ label: 'Aset Website', href: '/assets' }] },
  {
    heading: 'Preview & Publikasi',
    items: [
      { label: 'Preview', href: '/preview' },
      { label: 'Riwayat Publikasi', href: '/publications' },
    ],
  },
  { items: [{ label: 'Audit Konten', href: '/audit' }] },
];

const drawerPaths = ['/navigation', '/layouts', '/assets', '/preview', '/audit'];

const sites = [
  { label: 'Publik', href: appUrls.public },
  { label: 'Outlet', href: appUrls.outlet },
  { label: 'Portal', href: appUrls.portal },
];

function MenuList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      {menu.map((group, index) => (
        <div key={group.heading ?? index}>
          {group.heading ? (
            <p className="px-3 pb-1 text-xs font-semibold text-ink-500">{group.heading}</p>
          ) : null}
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isNavItemActive(item, pathname);
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-11 items-center rounded-control px-3 text-sm',
                      active
                        ? 'bg-console-soft font-semibold text-console'
                        : 'text-ink-700 hover:bg-surface-50',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function SiteLinks() {
  return (
    <ul className="flex flex-wrap gap-x-4">
      {sites.map((site) => (
        <li key={site.label}>
          <a
            href={site.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center text-sm underline"
          >
            {site.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function ConsoleLayout() {
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  const bottomItems: BottomNavItem[] = [
    { label: 'Dashboard', href: '/', match: 'exact', icon: LayoutDashboard },
    { label: 'Halaman', href: '/pages', icon: FileText },
    { label: 'Banner', href: '/banners', icon: Images },
    { label: 'Publikasi', href: '/publications', icon: History },
    {
      label: 'Lainnya',
      icon: Ellipsis,
      onPress: () => setDrawerOpen(true),
      expanded: drawerOpen || drawerPaths.some((path) => pathname.startsWith(path)),
    },
  ];

  return (
    <>
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-control focus:bg-surface-0 focus:px-3 focus:py-2"
      >
        Lewati ke isi
      </a>
      <header className="on-dark bg-ink-800 text-white">
        <div className="flex min-h-14 items-center justify-between gap-4 px-4 tablet:px-6">
          <Link to="/" className="inline-flex min-h-11 items-center font-display text-sm font-bold">
            Console Administrator Web
          </Link>
          <div className="hidden items-center gap-3 text-ink-300 tablet:flex">
            <span className="text-xs">Buka website:</span>
            <SiteLinks />
          </div>
        </div>
      </header>
      {usesMockData ? <MockRibbon /> : null}
      <div className="tablet:grid tablet:grid-cols-[15rem_minmax(0,1fr)]">
        <nav
          aria-label="Menu console"
          className="hidden border-r border-surface-100 p-3 tablet:block tablet:min-h-[calc(100dvh-3.5rem)]"
        >
          <MenuList pathname={pathname} />
        </nav>
        <main
          id="konten"
          ref={mainRef}
          tabIndex={-1}
          className={cn(
            'min-w-0 px-4 py-6 outline-none tablet:px-8 tablet:py-8',
            bottomNavOffsetClass,
          )}
        >
          <div className="mx-auto max-w-[64rem]">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav
        items={bottomItems}
        currentPath={pathname}
        LinkComponent={RouterLink}
        label="Navigasi bawah console"
        accent="console"
      />
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Menu console">
        <MenuList pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
        <div className="mt-4 border-t border-surface-100 pt-3">
          <p className="text-xs text-ink-700">Buka website:</p>
          <SiteLinks />
        </div>
      </Drawer>
    </>
  );
}
