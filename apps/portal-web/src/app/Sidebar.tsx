import type { StaffSession } from '@agrabudi/contracts';
import { cn, type IconComponent } from '@agrabudi/ui';
import {
  Activity,
  CardSim,
  ChartColumn,
  ChevronDown,
  ClipboardList,
  Globe,
  House,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
  Wifi,
} from 'lucide-react';
import { Link } from 'react-router';
import { roleLabel, visibleSections } from '../auth/access';
import {
  findModuleRoute,
  findSection,
  type ModuleGroup,
  type Section,
  type SectionId,
} from '../registry';

const linkClass = 'flex min-h-9 items-center rounded-control px-3 text-sm';
const activeClass = 'bg-brand-red-soft font-semibold text-brand-red-strong';
const toggleClass =
  'inline-flex size-11 shrink-0 items-center justify-center rounded-control text-ink-700 hover:bg-surface-50 hover:text-ink-900';

export const sectionIcon: Record<SectionId, IconComponent> = {
  telkomsel: CardSim,
  indihome: Wifi,
  admin: ClipboardList,
  website: Globe,
};

function GroupItem({
  section,
  group,
  pathname,
}: {
  section: Section;
  group: ModuleGroup;
  pathname: string;
}) {
  const groupPath = `${section.prefix}/${group.slug}`;
  const inGroup = pathname === groupPath || pathname.startsWith(`${groupPath}/`);

  if (!group.children) {
    return (
      <li>
        <Link
          to={groupPath}
          aria-current={inGroup ? 'page' : undefined}
          className={cn(linkClass, inGroup ? activeClass : 'text-ink-700 hover:bg-surface-50')}
        >
          {group.label}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <details open={inGroup} className="group/item">
        <summary
          className={cn(
            linkClass,
            'cursor-pointer justify-between gap-2',
            inGroup ? 'font-semibold text-ink-900' : 'text-ink-700 hover:bg-surface-50',
          )}
        >
          {group.label}
          <ChevronDown
            aria-hidden
            className="size-4 shrink-0 text-ink-500 transition-transform group-open/item:rotate-180"
          />
        </summary>
        <ul className="mt-1 ml-3 flex flex-col gap-0.5 border-l border-surface-100 pl-2">
          {group.children.map((leaf) => {
            const leafPath = `${groupPath}/${leaf.slug}`;
            const active = pathname === leafPath;
            return (
              <li key={leaf.slug}>
                <Link
                  to={leafPath}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    linkClass,
                    active ? activeClass : 'text-ink-700 hover:bg-surface-50',
                  )}
                >
                  {leaf.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </details>
    </li>
  );
}

type SidebarProps = {
  pathname: string;
  session: StaffSession;
  collapsed: boolean;
  /** Tanpa onToggle (mis. di laci HP) tombol ciutkan tidak tampil. */
  onToggle?: () => void;
  onSignOut: () => void;
};

type TopLink = { label: string; href: string; icon: IconComponent };

/** Menu umum di atas daftar modul. Admin Web tidak punya Aktivitas dan Laporan operasional. */
function topLinks(session: StaffSession): TopLink[] {
  return [
    { label: 'Dashboard', href: '/', icon: House },
    ...(session.role !== 'web_admin'
      ? [
          { label: 'Aktivitas', href: '/aktivitas', icon: Activity },
          { label: 'Laporan', href: '/laporan', icon: ChartColumn },
        ]
      : []),
  ];
}

const iconLinkClass = 'inline-flex size-11 items-center justify-center rounded-control';

/**
 * Sidebar modul. Bisa diciutkan menjadi deretan ikon bagian dan dibuka lagi.
 * Hanya memuat bagian dan menu yang boleh dilihat sesi ini.
 */
export function Sidebar({ pathname, session, collapsed, onToggle, onSignOut }: SidebarProps) {
  // Alias (mis. Database Pelanggan) disorot di modul tujuannya.
  const resolved = findModuleRoute(pathname)?.aliasOf ?? pathname;
  const activeSection = findSection(resolved);
  const visible = visibleSections(session);

  if (collapsed) {
    return (
      <nav
        aria-label="Modul Portal"
        data-sidebar="collapsed"
        className="flex flex-col items-center gap-1"
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={false}
          aria-label="Buka sidebar"
          className={toggleClass}
        >
          <PanelLeftOpen aria-hidden className="size-5" />
        </button>
        {topLinks(session).map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              title={item.label}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className={cn(
                iconLinkClass,
                active
                  ? 'bg-brand-red-soft text-brand-red-strong'
                  : 'text-ink-700 hover:bg-surface-50',
              )}
            >
              <item.icon aria-hidden className="size-5" />
            </Link>
          );
        })}
        <span aria-hidden className="my-1 h-px w-8 bg-surface-100" />
        {visible.map(({ section, entryPath }) => {
          const Icon = sectionIcon[section.id];
          const active = activeSection?.id === section.id;
          return (
            <Link
              key={section.id}
              to={entryPath}
              title={section.label}
              aria-label={section.label}
              aria-current={active ? 'true' : undefined}
              className={cn(
                'inline-flex size-11 items-center justify-center rounded-control',
                active
                  ? 'bg-brand-red-soft text-brand-red-strong'
                  : 'text-ink-700 hover:bg-surface-50',
              )}
            >
              <Icon aria-hidden className="size-5" />
            </Link>
          );
        })}
        <span aria-hidden className="my-1 h-px w-8 bg-surface-100" />
        <Link
          to="/akun"
          title={`Akun: ${session.displayName}`}
          aria-label="Akun"
          aria-current={pathname === '/akun' ? 'page' : undefined}
          className={cn(
            iconLinkClass,
            pathname === '/akun'
              ? 'bg-brand-red-soft text-brand-red-strong'
              : 'text-ink-700 hover:bg-surface-50',
          )}
        >
          <UserRound aria-hidden className="size-5" />
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          title="Keluar"
          aria-label="Keluar"
          className={toggleClass}
        >
          <LogOut aria-hidden className="size-5" />
        </button>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Modul Portal"
      data-sidebar={onToggle ? 'expanded' : 'drawer'}
      className="flex flex-col gap-2"
    >
      {onToggle ? (
        <div className="flex items-center justify-between">
          <p className="px-1 text-sm font-semibold text-ink-700">Menu</p>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded
            aria-label="Ciutkan sidebar"
            className={toggleClass}
          >
            <PanelLeftClose aria-hidden className="size-5" />
          </button>
        </div>
      ) : null}
      <ul className="flex flex-col gap-0.5">
        {topLinks(session).map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                to={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  linkClass,
                  'min-h-11 gap-2 font-semibold',
                  active ? activeClass : 'text-ink-900 hover:bg-surface-50',
                )}
              >
                <item.icon aria-hidden className="size-4 shrink-0" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      {visible.map(({ section, groups }) => {
        const Icon = sectionIcon[section.id];
        return (
          <details
            key={section.id}
            open={activeSection?.id === section.id || visible.length === 1}
            className="group/section rounded-control border border-ink-300"
          >
            <summary className="flex min-h-11 cursor-pointer items-center gap-2 rounded-control bg-surface-50 px-4 text-sm font-bold text-ink-900 hover:bg-ink-soft group-open/section:rounded-b-none group-open/section:border-b group-open/section:border-surface-100">
              <Icon aria-hidden className="size-4 text-brand-red" />
              <span className="flex-1">{section.label}</span>
              <ChevronDown
                aria-hidden
                className="size-4 shrink-0 text-ink-500 transition-transform group-open/section:rotate-180"
              />
            </summary>
            <ul className="flex flex-col gap-0.5 px-1 pb-2">
              {groups.map((group) => (
                <GroupItem key={group.slug} section={section} group={group} pathname={resolved} />
              ))}
            </ul>
          </details>
        );
      })}
      <div className="mt-2 flex flex-col gap-1 border-t border-ink-300 pt-3">
        <Link
          to="/akun"
          data-testid={onToggle ? 'peran-aktif' : 'peran-aktif-menu'}
          aria-current={pathname === '/akun' ? 'page' : undefined}
          className={cn(
            'flex min-h-11 items-center gap-3 rounded-control px-3 py-2',
            pathname === '/akun' ? 'bg-brand-red-soft' : 'hover:bg-surface-50',
          )}
        >
          <UserRound aria-hidden className="size-5 shrink-0 text-ink-700" />
          <span className="min-w-0 text-sm leading-tight">
            <span className="block truncate font-semibold text-ink-900">{session.displayName}</span>
            <span className="block truncate text-xs text-ink-700">{roleLabel(session)}, Akun</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          className={cn(linkClass, 'min-h-11 gap-2 text-ink-700 hover:bg-surface-50')}
        >
          <LogOut aria-hidden className="size-4" />
          Keluar
        </button>
      </div>
    </nav>
  );
}
