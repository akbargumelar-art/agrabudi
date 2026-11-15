import { PageHeader } from '@agrabudi/ui';
import { Link } from 'react-router';
import { sections } from '../../registry';

/** "Semua Menu": seluruh modul dari registry. Di HP dan tablet ini pengganti sidebar. */
export function AllMenuPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Semua Menu"
        description="Seluruh modul Portal. Setelah login aktif, daftar ini mengikuti izin akun."
      />
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={`bagian-${section.id}`}>
          <h2
            id={`bagian-${section.id}`}
            className="border-b-2 border-ink-900 pb-2 text-lg font-bold"
          >
            {section.label}
          </h2>
          <p className="mt-2 text-sm text-ink-700">{section.description}</p>
          <ul className="mt-4 grid gap-x-8 gap-y-5 tablet:grid-cols-2 desktop:grid-cols-3">
            {section.groups.map((group) => {
              const groupPath = `${section.prefix}/${group.slug}`;
              return (
                <li key={group.slug}>
                  <Link
                    to={groupPath}
                    className="inline-flex min-h-11 items-center font-semibold underline decoration-brand-red underline-offset-4"
                  >
                    {group.label}
                  </Link>
                  {group.children ? (
                    <ul className="flex flex-col">
                      {group.children.map((leaf) => (
                        <li key={leaf.slug}>
                          <Link
                            to={`${groupPath}/${leaf.slug}`}
                            className="flex min-h-11 items-center text-sm text-ink-700 hover:text-ink-900 tablet:min-h-8"
                          >
                            {leaf.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
