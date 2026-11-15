import { cn } from '@agrabudi/ui';
import { Link } from 'react-router';
import {
  findModuleRoute,
  findSection,
  sections,
  type ModuleGroup,
  type Section,
} from '../registry';

const linkClass = 'flex min-h-9 items-center rounded-control px-3 text-sm';

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
          className={cn(
            linkClass,
            inGroup
              ? 'bg-brand-red-soft font-semibold text-brand-red-strong'
              : 'text-ink-700 hover:bg-surface-50',
          )}
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
                    active
                      ? 'bg-brand-red-soft font-semibold text-brand-red-strong'
                      : 'text-ink-700 hover:bg-surface-50',
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

/** Sidebar modul untuk layar desktop. Di layar lebih kecil modul dibuka dari "Semua Menu". */
export function Sidebar({ pathname }: { pathname: string }) {
  // Alias (mis. Database Pelanggan) disorot di modul tujuannya.
  const resolved = findModuleRoute(pathname)?.aliasOf ?? pathname;
  const activeSection = findSection(resolved);

  return (
    <nav aria-label="Modul Portal" className="flex flex-col gap-2">
      {sections.map((section) => (
        <details
          key={section.id}
          open={activeSection?.id === section.id}
          className="rounded-panel border border-surface-100"
        >
          <summary className="flex min-h-11 cursor-pointer items-center px-3 font-display text-sm font-bold text-ink-900">
            {section.label}
          </summary>
          <ul className="flex flex-col gap-0.5 px-1 pb-2">
            {section.groups.map((group) => (
              <GroupItem key={group.slug} section={section} group={group} pathname={resolved} />
            ))}
          </ul>
        </details>
      ))}
    </nav>
  );
}
