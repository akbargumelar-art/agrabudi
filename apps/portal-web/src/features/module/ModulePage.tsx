import { EmptyState, PageHeader, StatusBadge, buttonClass } from '@agrabudi/ui';
import { Link, Navigate, useLocation } from 'react-router';
import { findModuleRoute, findSection } from '../../registry';

/**
 * Halaman kerangka satu modul Portal. Sengaja tanpa tabel dan angka contoh:
 * kolom, rumus, dan aksi tiap modul menunggu kamus data yang disahkan
 * (PRD 2.8, AS-10). Yang ditampilkan hanya nama menu dan perilaku inti dari PRD.
 */
export function ModulePage() {
  const { pathname } = useLocation();
  const route = findModuleRoute(pathname);
  const section = findSection(pathname);

  if (!route) {
    if (section && (pathname === section.prefix || pathname === `${section.prefix}/`)) {
      return <Navigate to={section.home} replace />;
    }
    return (
      <EmptyState
        title="Menu tidak ditemukan"
        description="Alamat ini tidak ada di daftar menu Portal."
        action={
          <Link to="/menu" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
            Buka Semua Menu
          </Link>
        }
      />
    );
  }

  if (route.aliasOf) {
    return <Navigate to={route.aliasOf} replace />;
  }

  const groupPath = `${route.section.prefix}/${route.group.slug}`;
  const children = route.leaf ? undefined : route.group.children;

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Posisi halaman" className="text-sm text-ink-700">
        <ol className="flex flex-wrap items-center gap-x-2">
          <li>{route.section.label}</li>
          <li aria-hidden>/</li>
          {route.leaf ? (
            <>
              <li>
                <Link to={groupPath} className="underline">
                  {route.group.label}
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="font-medium text-ink-900">
                {route.leaf.label}
              </li>
            </>
          ) : (
            <li aria-current="page" className="font-medium text-ink-900">
              {route.group.label}
            </li>
          )}
        </ol>
      </nav>

      <PageHeader title={route.title} aside={<StatusBadge tone="neutral">Kerangka</StatusBadge>} />

      <dl className="grid gap-x-6 gap-y-1 text-sm tablet:grid-cols-[10rem_minmax(0,1fr)]">
        <dt className="text-ink-700">Perilaku inti</dt>
        <dd className="max-w-prose">{route.group.behavior}</dd>
      </dl>

      {children ? (
        <section aria-labelledby="submenu">
          <h2 id="submenu" className="text-base font-bold">
            Submenu
          </h2>
          <ul className="mt-2 divide-y divide-surface-100 border-y border-surface-100">
            {children.map((leaf) => (
              <li key={leaf.slug}>
                <Link
                  to={`${groupPath}/${leaf.slug}`}
                  className="flex min-h-11 items-center text-sm font-medium hover:bg-surface-50"
                >
                  {leaf.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <EmptyState
          title="Belum ada data untuk ditampilkan"
          description="Kolom, filter, dan aksi modul ini dibangun setelah kamus datanya disahkan pemilik modul. Portal tidak menampilkan angka contoh."
        />
      )}
    </div>
  );
}
