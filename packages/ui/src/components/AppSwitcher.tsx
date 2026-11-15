import type { AppId, AppUrls } from '@agrabudi/contracts';
import { cn } from '../lib/cn';
import { containerClass } from './layout';

const APPS: ReadonlyArray<{ id: AppId; label: string }> = [
  { id: 'public', label: 'Publik' },
  { id: 'outlet', label: 'Outlet' },
  { id: 'portal', label: 'Portal' },
];

type AppSwitcherProps = {
  active: AppId;
  /** Wajib dari environment. Jangan hardcode domain produksi. */
  urls: AppUrls;
};

/**
 * Navigasi tingkat 1 (PRD K-03): bar ringkas di paling atas, teks lebih kecil
 * dari menu utama, garis bawah merah di aplikasi aktif.
 */
export function AppSwitcher({ active, urls }: AppSwitcherProps) {
  return (
    <nav aria-label="Pindah aplikasi" className="border-b border-surface-100 bg-surface-50">
      <ul className={cn(containerClass, 'flex gap-1')}>
        {APPS.map((app) => {
          const isActive = app.id === active;
          return (
            <li key={app.id}>
              <a
                href={urls[app.id]}
                aria-current={isActive ? 'true' : undefined}
                data-app={app.id}
                className={cn(
                  'inline-flex min-h-11 items-center border-b-2 px-3 font-display text-xs font-semibold tablet:min-h-9',
                  isActive
                    ? 'border-brand-red text-ink-900'
                    : 'border-transparent text-ink-500 hover:text-ink-900',
                )}
              >
                {app.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
