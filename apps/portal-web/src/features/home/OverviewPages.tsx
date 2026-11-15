import { EmptyState, PageHeader } from '@agrabudi/ui';
import { Link } from 'react-router';
import { sections } from '../../registry';

type Shortcut = { to: string; label: string; note: string };

function ShortcutList({ items }: { items: Shortcut[] }) {
  return (
    <ul className="divide-y divide-surface-100 border-y border-surface-100">
      {items.map((item) => (
        <li key={item.to}>
          <Link
            to={item.to}
            className="flex min-h-14 flex-col justify-center py-2 hover:bg-surface-50"
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
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Pintu masuk ke unit bisnis dan pengelolaan operasional."
      />
      <ShortcutList
        items={sections.map((section) => ({
          to: section.home,
          label: section.label,
          note: section.description,
        }))}
      />
      <EmptyState
        title="Ringkasan belum tersedia"
        description="Ringkasan target, order, dan aktivitas tampil setelah login dan sumber datanya tersedia. Tidak ada angka contoh di halaman ini."
      />
    </div>
  );
}

export function ActivityPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Aktivitas" description="Kunjungan, kehadiran, dan dokumentasi lapangan." />
      <ShortcutList
        items={[
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
        ]}
      />
      <EmptyState
        title="Belum ada aktivitas"
        description="Catatan aktivitas Anda muncul di sini setelah login dan pencatatan aktivitas tersedia."
      />
    </div>
  );
}

export function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Laporan" description="Laporan dan indikator per unit bisnis." />
      <ShortcutList
        items={[
          { to: '/telkomsel/laporan-looker', label: 'Laporan Looker', note: 'Telkomsel' },
          { to: '/telkomsel/performansi', label: 'Performansi', note: 'Telkomsel' },
          { to: '/telkomsel/sellthru', label: 'Sellthru', note: 'Telkomsel' },
          { to: '/telkomsel/kpi', label: 'KPI', note: 'Telkomsel' },
          { to: '/indihome/performance', label: 'Performance', note: 'IndiHome' },
          { to: '/indihome/kpi', label: 'KPI', note: 'IndiHome' },
        ]}
      />
    </div>
  );
}
