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
  /** Melayang di atas isi dengan jarak dari tepi layar (dipakai Portal). */
  floating?: boolean;
};

const activeText = 'font-semibold text-brand-red-strong';
const activePill = 'bg-brand-red-soft';

const itemClass = 'flex min-h-16 w-full flex-col items-center justify-center gap-0.5 px-1 text-xs';
const floatingItemClass = 'min-h-[3.75rem]';
const pillClass = 'flex h-7 w-14 items-center justify-center rounded-full';

export function BottomNav({
  items,
  currentPath,
  LinkComponent = AnchorLink,
  label = 'Navigasi bawah',
  floating = false,
}: BottomNavProps) {
  if (items.length > 5) {
    throw new Error('BottomNav menerima paling banyak lima item.');
  }
  return (
    <nav
      aria-label={label}
      data-bottom-nav
      data-floating={floating ? '' : undefined}
      className={cn(
        'fixed z-40 bg-surface-0 tablet:hidden',
        floating
          ? 'inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] rounded-full border border-surface-100 px-1 shadow-raised'
          : 'inset-x-0 bottom-0 rounded-t-panel pb-[env(safe-area-inset-bottom)] shadow-raised-up',
      )}
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
                  className={cn(itemClass, floating && floatingItemClass, item.expanded ? activeText : 'text-ink-700')}
                >
                  <span className={cn(pillClass, item.expanded && activePill)}>
                    <Icon aria-hidden className="size-5" />
                  </span>
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
                className={cn(itemClass, floating && floatingItemClass, active ? activeText : 'text-ink-700')}
              >
                <span className={cn(pillClass, active && activePill)}>
                  <Icon aria-hidden className="size-5" />
                </span>
                <span>{item.label}</span>
              </LinkComponent>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
