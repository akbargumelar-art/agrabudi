import {
  AppSwitcher,
  BottomNav,
  MainNav,
  MockRibbon,
  Wordmark,
  bottomNavOffsetClass,
  buttonClass,
  cn,
  containerClass,
  type BottomNavItem,
  type NavItem,
} from '@agrabudi/ui';
import { House, Megaphone, ReceiptText, ShoppingCart, UserRound } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { useOutletSession } from '../auth/SessionContext';
import { appUrls, usesMockData } from './env';
import { RouterLink } from './RouterLink';

/** Menu utama Outlet (PRD 2.2). */
const mainItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'ABKShop', href: '/abkshop', alsoActiveOn: ['/checkout'] },
  { label: 'Kalkulator Cuan', href: '/kalkulator' },
  { label: 'Promo & Program', href: '/program' },
  { label: 'Pesanan', href: '/pesanan' },
];

/** Bottom navigation Outlet (PRD 2.2). Kalkulator dibuka dari Home dan menu utama. */
const bottomItems: BottomNavItem[] = [
  { label: 'Home', href: '/', icon: House },
  { label: 'ABKShop', href: '/abkshop', alsoActiveOn: ['/checkout'], icon: ShoppingCart },
  { label: 'Pesanan', href: '/pesanan', icon: ReceiptText },
  { label: 'Program', href: '/program', icon: Megaphone },
  {
    label: 'Akun',
    href: '/akun',
    alsoActiveOn: ['/login', '/lupa-akses', '/ganti-kata-sandi'],
    icon: UserRound,
  },
];

export function OutletLayout() {
  const { pathname } = useLocation();
  const { session } = useOutletSession();
  const mainRef = useRef<HTMLElement>(null);

  // Pindah halaman: kembali ke atas dan pindahkan fokus ke isi untuk pembaca layar.
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
      <AppSwitcher active="outlet" urls={appUrls} />
      <MainNav
        brand={
          <Link
            to="/"
            aria-label="Agrabudi Outlet, ke Home"
            className="inline-flex min-h-11 items-center"
          >
            <Wordmark app="Outlet" />
          </Link>
        }
        items={mainItems}
        currentPath={pathname}
        LinkComponent={RouterLink}
        actions={
          // Disembunyikan lewat pembungkus: `cn` tidak menyelesaikan konflik kelas, sehingga
          // `hidden` pada tombol kalah oleh `inline-flex` dari buttonClass dan chip melebar di HP.
          // Di HP akun dibuka dari menu bawah.
          <div className="hidden tablet:block">
            <Link
              to={session ? '/akun' : '/login'}
              data-testid="akun-outlet"
              className={cn(buttonClass({ variant: 'secondary', size: 'sm' }), 'max-w-48')}
            >
              <span className="truncate">{session ? session.outletName : 'Masuk'}</span>
            </Link>
          </div>
        }
      />
      {usesMockData ? <MockRibbon /> : null}
      <main
        id="konten"
        ref={mainRef}
        tabIndex={-1}
        className={cn(containerClass, 'py-6 outline-none tablet:py-10', bottomNavOffsetClass)}
      >
        <Outlet />
      </main>
      <BottomNav items={bottomItems} currentPath={pathname} LinkComponent={RouterLink} />
    </>
  );
}
