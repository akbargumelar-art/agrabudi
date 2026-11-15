import { cn } from '../lib/cn';
import {
  AnchorLink,
  isNavItemActive,
  type IconComponent,
  type LinkComponent,
  type NavItem,
} from '../lib/nav';

export type BottomNavItem =
  | (NavItem & { icon: IconComponent })
  | { label: string; icon: IconComponent; onPress: () => void; expanded: boolean };

type BottomNavProps = {
  /** Maksimal lima item. Hanya satu BottomNav per aplikasi (PRD AS-05). */
  items: BottomNavItem[];
  currentPath: string;
  LinkComponent?: LinkComponent;
  label?: string;
  /** `console` dipakai Administrator Web supaya tidak tertukar dengan aplikasi lain. */
  accent?: 'brand' | 'console';
};

const activeClass = {
  brand: 'border-brand-red font-semibold text-brand-red-strong',
  console: 'border-console font-semibold text-console',
} as const;

const itemClass =
  'flex min-h-14 w-full flex-col items-center justify-center gap-0.5 border-t-2 px-1 text-xs';

export function BottomNav({
  items,
  currentPath,
  LinkComponent = AnchorLink,
  label = 'Navigasi bawah',
  accent = 'brand',
}: BottomNavProps) {
  if (items.length > 5) {
    throw new Error('BottomNav menerima paling banyak lima item.');
  }
  return (
    <nav
      aria-label={label}
      data-bottom-nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-100 bg-surface-0 pb-[env(safe-area-inset-bottom)] tablet:hidden"
    >
      <ul
        className="grid"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          if ('onPress' in item) {
            return (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={item.onPress}
                  aria-haspopup="dialog"
                  aria-expanded={item.expanded}
                  className={cn(
                    itemClass,
                    item.expanded ? activeClass[accent] : 'border-transparent text-ink-700',
                  )}
                >
                  <Icon aria-hidden className="size-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          }
          const active = isNavItemActive(item, currentPath);
          return (
            <li key={item.href}>
              <LinkComponent
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  itemClass,
                  active ? activeClass[accent] : 'border-transparent text-ink-700',
                )}
              >
                <Icon aria-hidden className="size-5" />
                <span>{item.label}</span>
              </LinkComponent>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
