import { AsyncView, EmptyState, ErrorState, PageHeader, buttonClass } from '@agrabudi/ui';
import { Link, Navigate, useLocation } from 'react-router';
import { accessModeLabel, routeAccess, scopePhrase, visibleSections } from '../../auth/access';
import { useSession } from '../../auth/SessionContext';
import { consolePages } from '../../console/ConsolePage';
import { useDataset } from '../../data/queries';
import { findModuleRoute, findSection } from '../../registry';
import { DataView } from './DataView';

function AccessDenied() {
  return (
    <ErrorState
      title="Akses ditolak"
      description="Akun Anda tidak punya izin membuka menu ini. Bila seharusnya punya, hubungi pengelola akses."
      action={
        <Link to="/menu" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
          Buka menu yang tersedia
        </Link>
      }
    />
  );
}

/**
 * Halaman satu modul Portal. Data datang dari adapter (contoh atau API) yang sudah
 * menyaring cakupan sesi. Kolom final tiap modul mengikuti kamus data yang disahkan
 * (PRD 2.8); di mode contoh angkanya rekaan dan diberi label.
 */
export function ModulePage() {
  const { pathname } = useLocation();
  const session = useSession();
  const route = findModuleRoute(pathname);
  const section = findSection(pathname);

  if (!route) {
    if (section && (pathname === section.prefix || pathname === `${section.prefix}/`)) {
      const entry = visibleSections(session).find((item) => item.section.id === section.id);
      return entry ? <Navigate to={entry.entryPath} replace /> : <AccessDenied />;
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

  const access = routeAccess(session, route);
  if (!access) return <AccessDenied />;

  if (route.aliasOf) {
    return <Navigate to={route.aliasOf} replace />;
  }

  // Menu Website punya halamannya sendiri (pengaturan isi website).
  if (route.section.id === 'website') {
    const ConsolePage = consolePages[route.group.slug];
    if (ConsolePage) return <ConsolePage />;
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

      <PageHeader title={route.title} />

      <dl className="grid gap-x-6 gap-y-1 text-sm tablet:grid-cols-[10rem_minmax(0,1fr)]">
        <dt className="text-ink-700">Perilaku inti</dt>
        <dd className="max-w-prose">{route.group.behavior}</dd>
        <dt className="text-ink-700">Hak akses Anda</dt>
        <dd data-testid="hak-akses">
          {accessModeLabel[access]}. Cakupan data: {scopePhrase(session)}.
        </dd>
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
        <ModuleData path={pathname.replace(/\/$/, '')} />
      )}
    </div>
  );
}

function ModuleData({ path }: { path: string }) {
  const dataset = useDataset(path);
  return (
    <AsyncView state={dataset} errorTitle="Data modul tidak dapat dimuat" loadingLabel="Memuat data modul">
      {(envelope) =>
        envelope.data ? (
          <DataView key={path} path={path} dataset={envelope.data} meta={envelope.meta} />
        ) : (
          <EmptyState
            title="Belum ada data untuk ditampilkan"
            description="Kolom, filter, dan aksi modul ini dibangun setelah kamus datanya disahkan pemilik modul."
          />
        )
      }
    </AsyncView>
  );
}
