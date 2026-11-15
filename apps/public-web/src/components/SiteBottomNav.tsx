'use client';

import { BottomNav, Drawer, type BottomNavItem } from '@agrabudi/ui';
import { Briefcase, Ellipsis, House, Package, Wifi } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { NextLink } from './NextLink';

const moreLinks = [
  { label: 'Tentang Kami', href: '/tentang' },
  { label: 'Area layanan', href: '/tentang/area' },
  { label: 'Lokasi kantor', href: '/tentang/kantor' },
  { label: 'Hubungi Kami', href: '/kontak' },
  { label: 'Promo & Program', href: '/promo' },
  { label: 'Daftar Digipos', href: '/digipos' },
];

/** Bottom navigation Publik (PRD 2.2): Home, Produk, IndiHome, Karir, Lainnya. */
export function SiteBottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const inMore = moreLinks.some(
    (link) => pathname === link.href || pathname.startsWith(`${link.href}/`),
  );

  const items: BottomNavItem[] = [
    { label: 'Home', href: '/', icon: House },
    { label: 'Produk', href: '/produk', icon: Package },
    { label: 'IndiHome', href: '/indihome', icon: Wifi },
    { label: 'Karir', href: '/karir', icon: Briefcase },
    { label: 'Lainnya', icon: Ellipsis, onPress: () => setOpen(true), expanded: open || inMore },
  ];

  return (
    <>
      <BottomNav items={items} currentPath={pathname} LinkComponent={NextLink} />
      <Drawer open={open} onClose={() => setOpen(false)} title="Menu lainnya">
        <ul className="flex flex-col">
          {moreLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={pathname === link.href ? 'page' : undefined}
                className="flex min-h-12 items-center border-b border-surface-100 text-base font-medium aria-[current=page]:text-brand-red-strong"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </Drawer>
    </>
  );
}
