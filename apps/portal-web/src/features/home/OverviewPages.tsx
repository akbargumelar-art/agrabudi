import type { StaffSession } from '@agrabudi/contracts';
import { EmptyState, IconBadge, PageHeader, cardClass, cn, type IconComponent } from '@agrabudi/ui';
import { CardSim, ClipboardList, Wifi } from 'lucide-react';
import { Link } from 'react-router';
import { roleLabel, routeAccess, scopePhrase, visibleSections } from '../../auth/access';
import { useSession } from '../../auth/SessionContext';
import { findModuleRoute, type SectionId } from '../../registry';

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

const sectionIcon: Record<SectionId, IconComponent> = {
  telkomsel: CardSim,
  indihome: Wifi,
  admin: ClipboardList,
};

export function DashboardPage() {
  const session = useSession();
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
                tone={section.id === 'admin' ? 'navy' : 'red'}
              />
              <span>
                <span className="block font-semibold">{section.label}</span>
                <span className="block text-sm text-ink-700">{section.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <EmptyState
        title="Ringkasan belum tersedia"
        description="Ringkasan target, order, dan aktivitas tampil setelah sumber datanya tersedia. Tidak ada angka contoh di halaman ini."
      />
    </div>
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
