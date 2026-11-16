'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { AnchorLink, isNavItemActive, type LinkComponent, type NavItem } from '../lib/nav';
import { containerClass } from './layout';

type MainNavProps = {
  brand: ReactNode;
  items: NavItem[];
  currentPath: string;
  LinkComponent?: LinkComponent;
  /** `light` untuk tiga aplikasi; `dark` tersedia untuk kebutuhan khusus. */
  tone?: 'dark' | 'light';
  actions?: ReactNode;
  label?: string;
};

const arrowClass =
  'inline-flex size-9 items-center justify-center rounded-full border border-ink-300 bg-surface-0 text-ink-900 hover:border-ink-900';

/**
 * Navigasi tingkat 2 (PRD K-04). Isinya dari konfigurasi tiap aplikasi.
 * Di smartphone hanya merek dan aksi yang tampil; menu pindah ke BottomNav.
 *
 * Bila menu tidak muat, scrollbar bawaan browser disembunyikan dan diganti panah
 * kiri/kanan yang sebaris dengan judul menu. Panah hanya tampil di sisi yang masih
 * punya menu tersembunyi.
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
  const trackRef = useRef<HTMLUListElement>(null);
  const [hidden, setHidden] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const left = track.scrollLeft > 1;
    const right = track.scrollLeft + track.clientWidth < track.scrollWidth - 1;
    setHidden((current) =>
      current.left === left && current.right === right ? current : { left, right },
    );
  }, []);

  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    // Lebar menu berubah setelah font selesai dimuat.
    void document.fonts?.ready.then(update);
    return () => window.removeEventListener('resize', update);
  }, [update, items.length]);

  // Menu aktif selalu terlihat setelah pindah halaman.
  useEffect(() => {
    const track = trackRef.current;
    const active = track?.querySelector<HTMLElement>('[aria-current="page"]');
    if (track && active) {
      const start = active.offsetLeft - track.offsetLeft;
      const end = start + active.offsetWidth;
      if (start < track.scrollLeft) track.scrollLeft = start;
      else if (end > track.scrollLeft + track.clientWidth)
        track.scrollLeft = end - track.clientWidth;
    }
    update();
  }, [currentPath, update]);

  function move(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.6, behavior: 'smooth' });
  }

  const fadeFrom = dark ? 'from-ink-900' : 'from-surface-0';

  return (
    <header
      className={cn(
        'sticky top-0 z-30 shadow-raised',
        dark ? 'on-dark bg-ink-900 text-white' : 'bg-surface-0',
      )}
    >
      <div className={cn(containerClass, 'flex min-h-14 items-center gap-6 tablet:min-h-16')}>
        <div className="shrink-0">{brand}</div>
        <nav
          aria-label={label}
          data-nav-scroller
          className="relative hidden min-w-0 flex-1 tablet:block"
        >
          <ul
            ref={trackRef}
            onScroll={update}
            className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((item) => {
              const active = isNavItemActive(item, currentPath);
              return (
                <li key={item.href} className="shrink-0">
                  <LinkComponent
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'inline-flex min-h-16 items-center border-b-[3px] px-3 text-sm font-semibold whitespace-nowrap',
                      active ? 'border-brand-red' : 'border-transparent',
                      dark && (active ? 'text-white' : 'text-ink-300 hover:text-white'),
                      !dark &&
                        (active
                          ? 'text-brand-red-strong'
                          : 'text-ink-900 hover:text-brand-red-strong'),
                    )}
                  >
                    {item.label}
                  </LinkComponent>
                </li>
              );
            })}
          </ul>
          <div
            hidden={!hidden.left}
            className={cn(
              'absolute inset-y-0 left-0 flex items-center bg-linear-to-r pr-6 to-transparent from-65%',
              fadeFrom,
            )}
          >
            <button
              type="button"
              data-nav-prev
              aria-label="Geser menu ke kiri"
              onClick={() => move(-1)}
              className={arrowClass}
            >
              <ChevronLeft aria-hidden className="size-5" />
            </button>
          </div>
          <div
            hidden={!hidden.right}
            className={cn(
              'absolute inset-y-0 right-0 flex items-center bg-linear-to-l pl-6 to-transparent from-65%',
              fadeFrom,
            )}
          >
            <button
              type="button"
              data-nav-next
              aria-label="Geser menu ke kanan"
              onClick={() => move(1)}
              className={arrowClass}
            >
              <ChevronRight aria-hidden className="size-5" />
            </button>
          </div>
        </nav>
        {actions ? <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
