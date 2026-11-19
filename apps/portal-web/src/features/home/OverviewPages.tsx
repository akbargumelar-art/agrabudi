import type { StaffSession } from '@agrabudi/contracts';
import {
  AsyncView,
  DataNotice,
  EmptyState,
  IconBadge,
  PageHeader,
  cardClass,
  cn,
} from '@agrabudi/ui';
import { Link, Navigate } from 'react-router';
import { roleLabel, routeAccess, scopePhrase, visibleSections } from '../../auth/access';
import { useSession } from '../../auth/SessionContext';
import { sectionIcon } from '../../app/Sidebar';
import { useDataset } from '../../data/queries';
import { findModuleRoute } from '../../registry';

type Shortcut = { to: string; label: string; note: string };

/** Pintasan hanya ditampilkan bila modul tujuannya boleh dibuka sesi ini. */
function permitted(session: StaffSession, items: Shortcut[]): Shortcut[] {
  return items.filter((item) => {
    const route = findModuleRoute(item.to);
    return route !== undefined && routeAccess(session, route) !== null;
  });
}

function ShortcutList({ items, emptyTitle }: { items: Shortcut[]; emptyTitle: string }) {
  if (items.length === 0) {
    return (
      <EmptyState title={emptyTitle} description="Tidak ada menu di bagian ini untuk peran Anda." />
    );
  }
  return (
    <ul className={cn(cardClass, 'divide-y divide-surface-100 overflow-hidden')}>
      {items.map((item) => (
        <li key={item.to}>
          <Link
            to={item.to}
            className="flex min-h-14 flex-col justify-center px-5 py-2 hover:bg-surface-50"
          >
            <span className="font-semibold">{item.label}</span>
            <span className="text-sm text-ink-700">{item.note}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function DashboardPage() {
  const session = useSession();
  if (session.role === 'web_admin') return <Navigate to="/web-admin/dashboard" replace />;
  const summaries = permitted(session, [
    { to: '/telkomsel/dashboard', label: 'Telkomsel', note: '' },
    { to: '/indihome/dashboard', label: 'IndiHome', note: '' },
  ]);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description={`Anda masuk sebagai ${roleLabel(session)}. Cakupan data: ${scopePhrase(session)}.`}
      />
      <ul className="grid gap-3 tablet:grid-cols-3">
        {visibleSections(session).map(({ section, entryPath }) => (
          <li key={section.id}>
            <Link
              to={entryPath}
              className={cn(cardClass, 'flex h-full items-center gap-4 p-5 hover:border-brand-red')}
            >
              <IconBadge
                icon={sectionIcon[section.id]}
                tone={section.id === 'admin' ? 'ink' : 'red'}
              />
              <span>
                <span className="block font-semibold">{section.label}</span>
                <span className="block text-sm text-ink-700">{section.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {summaries.length > 0 ? (
        summaries.map((item) => <DashboardSummary key={item.to} {...item} />)
      ) : (
        <WebsiteShortcuts />
      )}
    </div>
  );
}

function DashboardSummary({ to, label }: { to: string; label: string }) {
  const dataset = useDataset(to);
  return (
    <section aria-label={`Ringkasan ${label}`} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Ringkasan {label}</h2>
        <Link to={to} className="text-sm font-semibold text-brand-red underline">
          Buka dashboard {label}
        </Link>
      </div>
      <AsyncView
        state={dataset}
        errorTitle={`Ringkasan ${label} tidak dapat dimuat`}
        loadingLabel="Memuat ringkasan"
      >
        {(envelope) =>
          envelope.data ? (
            <div className="flex flex-col gap-3">
              <div>
                <DataNotice meta={envelope.meta} />
              </div>
              <ul className="grid grid-cols-2 gap-3 desktop:grid-cols-4" data-testid="ringkasan">
                {envelope.data.stats.map((stat) => (
                  <li key={stat.label} className={cn(cardClass, 'p-4')}>
                    <p className="text-sm text-ink-700">{stat.label}</p>
                    <p className="mt-1 text-2xl font-extrabold tabular-nums">{stat.value}</p>
                    {stat.note ? <p className="mt-1 text-xs text-ink-500">{stat.note}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <EmptyState
              title="Ringkasan belum tersedia"
              description="Sumber data ringkasan belum tersedia."
            />
          )
        }
      </AsyncView>
    </section>
  );
}

function WebsiteShortcuts() {
  const session = useSession();
  return (
    <section aria-labelledby="pintasan-web" className="flex flex-col gap-3">
      <h2 id="pintasan-web" className="text-lg font-bold">
        Pintasan pengelolaan website
      </h2>
      <ShortcutList
        emptyTitle="Tidak ada pintasan"
        items={permitted(session, [
          { to: '/web-admin/banners', label: 'Banner', note: 'Slide utama halaman depan Publik' },
          {
            to: '/web-admin/pages',
            label: 'Halaman',
            note: 'Isi halaman Tentang, Kontak, dan lainnya',
          },
          {
            to: '/web-admin/abkshop',
            label: 'Halaman ABKShop',
            note: 'Alamat halaman pemesanan di aplikasi Outlet',
          },
          { to: '/web-admin/preview', label: 'Pratinjau', note: 'Buka situs Publik dan Outlet' },
        ])}
      />
    </section>
  );
}

export function ActivityPage() {
  const session = useSession();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Aktivitas" description="Kunjungan, kehadiran, dan dokumentasi lapangan." />
      <ShortcutList
        emptyTitle="Tidak ada menu aktivitas"
        items={permitted(session, [
          {
            to: '/telkomsel/dokumentasi/monitoring-visit',
            label: 'Monitoring Visit',
            note: 'Telkomsel, Dokumentasi',
          },
          { to: '/telkomsel/monitoring-pop', label: 'Monitoring POP', note: 'Telkomsel' },
          { to: '/indihome/clock-in-mb', label: 'Clock-in MB', note: 'IndiHome' },
          {
            to: '/indihome/dokumentasi/door-to-door',
            label: 'Door to Door',
            note: 'IndiHome, Dokumentasi',
          },
          {
            to: '/indihome/dokumentasi/open-booth',
            label: 'Open Booth',
            note: 'IndiHome, Dokumentasi',
          },
        ])}
      />
    </div>
  );
}

export function ReportsPage() {
  const session = useSession();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Laporan" description="Laporan dan indikator per unit bisnis." />
      <ShortcutList
        emptyTitle="Tidak ada menu laporan"
        items={permitted(session, [
          { to: '/telkomsel/laporan-looker', label: 'Laporan Looker', note: 'Telkomsel' },
          { to: '/telkomsel/performansi', label: 'Performansi', note: 'Telkomsel' },
          { to: '/telkomsel/sellthru', label: 'Sellthru', note: 'Telkomsel' },
          { to: '/telkomsel/kpi', label: 'KPI', note: 'Telkomsel' },
          { to: '/telkomsel/direct-to-customer', label: 'Direct to Customer', note: 'Telkomsel' },
          { to: '/indihome/performance', label: 'Performance', note: 'IndiHome' },
          { to: '/indihome/kpi', label: 'KPI', note: 'IndiHome' },
        ])}
      />
    </div>
  );
}
