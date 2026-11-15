import type { StaffSession } from '@agrabudi/contracts';
import { cn } from '@agrabudi/ui';
import { Link } from 'react-router';
import { visibleSections } from '../auth/access';
import { findModuleRoute, findSection, type ModuleGroup, type Section } from '../registry';

const linkClass = 'flex min-h-9 items-center rounded-control px-3 text-sm';
const activeClass = 'bg-brand-red-soft font-semibold text-brand-red-strong';

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
      <details open={inGroup}>
        <summary
          className={cn(
            linkClass,
            'cursor-pointer justify-between',
            inGroup ? 'font-semibold text-ink-900' : 'text-ink-700 hover:bg-surface-50',
          )}
        >
          {group.label}
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

/** Sidebar modul untuk desktop. Hanya memuat bagian dan menu yang boleh dilihat sesi ini. */
export function Sidebar({ pathname, session }: { pathname: string; session: StaffSession }) {
  // Alias (mis. Database Pelanggan) disorot di modul tujuannya.
  const resolved = findModuleRoute(pathname)?.aliasOf ?? pathname;
  const activeSection = findSection(resolved);
  const visible = visibleSections(session);

  return (
    <nav aria-label="Modul Portal" className="flex flex-col gap-2">
      {visible.map(({ section, groups }) => (
        <details
          key={section.id}
          open={activeSection?.id === section.id || visible.length === 1}
          className="rounded-panel border border-surface-100"
        >
          <summary className="flex min-h-11 cursor-pointer items-center px-4 font-display text-sm font-bold text-ink-900">
            {section.label}
          </summary>
          <ul className="flex flex-col gap-0.5 px-1 pb-2">
            {groups.map((group) => (
              <GroupItem key={group.slug} section={section} group={group} pathname={resolved} />
            ))}
          </ul>
        </details>
      ))}
    </nav>
  );
}
