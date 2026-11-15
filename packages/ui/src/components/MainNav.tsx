import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { AnchorLink, isNavItemActive, type LinkComponent, type NavItem } from '../lib/nav';
import { containerClass } from './layout';

type MainNavProps = {
  brand: ReactNode;
  items: NavItem[];
  currentPath: string;
  LinkComponent?: LinkComponent;
  /** `dark` untuk header Publik, `light` untuk aplikasi kerja. */
  tone?: 'dark' | 'light';
  actions?: ReactNode;
  label?: string;
};

/**
 * Navigasi tingkat 2 (PRD K-04). Isinya dari konfigurasi tiap aplikasi.
 * Di smartphone hanya merek dan aksi yang tampil; menu pindah ke BottomNav.
 */
export function MainNav({
  brand,
  items,
  currentPath,
  LinkComponent = AnchorLink,
  tone = 'light',
  actions,
  label = 'Menu utama',
}: MainNavProps) {
  const dark = tone === 'dark';
  return (
    <header
      className={cn(
        dark ? 'on-dark bg-ink-900 text-white' : 'border-b border-surface-100 bg-surface-0',
      )}
    >
      <div className={cn(containerClass, 'flex min-h-14 items-center gap-6 tablet:min-h-16')}>
        <div className="shrink-0">{brand}</div>
        <nav aria-label={label} className="hidden min-w-0 flex-1 tablet:block">
          <ul className="flex gap-1 overflow-x-auto">
            {items.map((item) => {
              const active = isNavItemActive(item, currentPath);
              return (
                <li key={item.href} className="shrink-0">
                  <LinkComponent
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'inline-flex min-h-16 items-center border-b-2 px-3 text-sm font-medium whitespace-nowrap',
                      active && 'border-brand-red font-semibold',
                      !active && 'border-transparent',
                      dark && (active ? 'text-white' : 'text-ink-300 hover:text-white'),
                      !dark && (active ? 'text-ink-900' : 'text-ink-700 hover:text-ink-900'),
                    )}
                  >
                    {item.label}
                  </LinkComponent>
                </li>
              );
            })}
          </ul>
        </nav>
        {actions ? <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
