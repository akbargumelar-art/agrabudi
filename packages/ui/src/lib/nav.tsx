import type { ComponentType, ReactNode } from 'react';

export type LinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  'aria-current'?: 'page';
  'aria-label'?: string;
  onClick?: () => void;
};

/**
 * Komponen link dari router aplikasi (next/link atau React Router).
 * `packages/ui` tidak bergantung pada router mana pun.
 */
export type LinkComponent = ComponentType<LinkProps>;

export function AnchorLink(props: LinkProps) {
  return <a {...props} />;
}

export type IconComponent = ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;

export type NavItem = {
  label: string;
  href: string;
  /** `exact` hanya aktif di path yang sama; `prefix` aktif juga di sub-halaman. */
  match?: 'exact' | 'prefix';
  /** Path tambahan yang ikut mengaktifkan item ini. */
  alsoActiveOn?: string[];
};

function normalize(path: string): string {
  const clean = path.split(/[?#]/)[0] ?? '/';
  return clean.length > 1 && clean.endsWith('/') ? clean.slice(0, -1) : clean || '/';
}

function matches(target: string, current: string, mode: 'exact' | 'prefix'): boolean {
  if (target === current) return true;
  if (mode === 'exact' || target === '/') return false;
  return current.startsWith(`${target}/`);
}

export function isNavItemActive(item: NavItem, currentPath: string): boolean {
  const current = normalize(currentPath);
  const mode = item.match ?? (item.href === '/' ? 'exact' : 'prefix');
  if (matches(normalize(item.href), current, mode)) return true;
  return (item.alsoActiveOn ?? []).some((path) => matches(normalize(path), current, 'prefix'));
}
