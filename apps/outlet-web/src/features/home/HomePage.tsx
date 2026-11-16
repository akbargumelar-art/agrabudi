import {
  AsyncView,
  DataNotice,
  EmptyState,
  IconBadge,
  SectionHeading,
  SignalRings,
  buttonClass,
  cardClass,
  cn,
  formatDate,
  moreLinkClass,
  type IconComponent,
} from '@agrabudi/ui';
import { Calculator, ChevronRight, Megaphone, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router';
import { usePrograms } from '../../data/queries';
import { WinnerSlider } from './WinnerSlider';

const tasks: Array<{ to: string; label: string; note: string; icon: IconComponent }> = [
  { to: '/abkshop', label: 'ABKShop', note: 'Pesan paket untuk outlet Anda.', icon: ShoppingCart },
  {
    to: '/program',
    label: 'Promo & Program',
    note: 'Periode dan syarat program mitra.',
    icon: Megaphone,
  },
  { to: '/kalkulator', label: 'Kalkulator Cuan', note: 'Menunggu rumus resmi.', icon: Calculator },
];

export function HomePage() {
  const programs = usePrograms();

  return (
    <div className="flex flex-col gap-10">
      <section className="on-dark relative overflow-hidden rounded-banner bg-linear-to-br from-brand-red to-brand-maroon p-6 text-white tablet:p-12">
        <SignalRings className="pointer-events-none absolute -right-10 -bottom-10 size-72 text-white opacity-15 tablet:size-96" />
        <div className="relative max-w-xl">
          <h1 className="text-3xl leading-tight font-extrabold tablet:text-4xl">
            Belanja paket untuk outlet Anda
          </h1>
          <p className="mt-3 text-white/90">
            Pesan paket lewat ABKShop, ikuti program mitra, dan lihat pemenang program terbaru.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/abkshop" className={buttonClass({ variant: 'inverse' })}>
              Buka ABKShop
            </Link>
            <Link to="/program" className={buttonClass({ variant: 'on-dark' })}>
              Lihat program
            </Link>
          </div>
        </div>
      </section>

      <WinnerSlider />

      <ul className="grid gap-3 tablet:grid-cols-3 tablet:gap-4">
        {tasks.map((task) => (
          <li key={task.to}>
            <Link
              to={task.to}
              className={cn(cardClass, 'flex h-full items-center gap-3 p-4 hover:border-brand-red')}
            >
              <IconBadge icon={task.icon} />
              <span>
                <span className="block font-semibold">{task.label}</span>
                <span className="block text-sm text-ink-700">{task.note}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="program-berjalan">
        <SectionHeading
          id="program-berjalan"
          size="sm"
          title="Program untuk outlet"
          aside={
            <>
              {programs.data ? <DataNotice meta={programs.data.meta} /> : null}
              <Link to="/program" className={moreLinkClass}>
                Semua program
                <ChevronRight aria-hidden className="size-4" />
              </Link>
            </>
          }
        />
        <div className="mt-4">
          <AsyncView
            state={programs}
            errorTitle="Program tidak dapat dimuat"
            loadingLabel="Memuat program"
          >
            {(envelope) =>
              envelope.data.length === 0 ? (
                <EmptyState
                  title="Belum ada program"
                  description="Program baru muncul setelah diterbitkan."
                />
              ) : (
                <ul className={cn(cardClass, 'divide-y divide-surface-100 overflow-hidden')}>
                  {envelope.data.slice(0, 3).map((program) => (
                    <li key={program.id}>
                      <Link
                        to={`/program/${program.slug}`}
                        className="flex min-h-16 items-center justify-between gap-4 px-5 py-3 hover:bg-surface-50"
                      >
                        <span>
                          <span className="block font-semibold">{program.title}</span>
                          <span className="block text-sm text-ink-700">
                            Sampai {formatDate(program.endsAt)}
                          </span>
                        </span>
                        <ChevronRight aria-hidden className="size-5 shrink-0 text-ink-500" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )
            }
          </AsyncView>
        </div>
      </section>
    </div>
  );
}
