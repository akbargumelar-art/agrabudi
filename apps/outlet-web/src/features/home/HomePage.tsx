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
  formatRupiah,
  moreLinkClass,
  type IconComponent,
} from '@agrabudi/ui';
import { Calculator, ChevronRight, Megaphone, ReceiptText, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router';
import { useOrders, usePrograms } from '../../data/queries';
import { OrderStatusBadge } from '../orders/status';

const tasks: Array<{ to: string; label: string; note: string; icon: IconComponent }> = [
  {
    to: '/abkshop',
    label: 'ABKShop',
    note: 'Beli paket lewat tabel pemesanan.',
    icon: ShoppingCart,
  },
  { to: '/pesanan', label: 'Pesanan', note: 'Status order dan pembayaran.', icon: ReceiptText },
  {
    to: '/program',
    label: 'Promo & Program',
    note: 'Periode dan syarat program mitra.',
    icon: Megaphone,
  },
  { to: '/kalkulator', label: 'Kalkulator Cuan', note: 'Menunggu rumus resmi.', icon: Calculator },
];

function MoreLink({ to, children }: { to: string; children: string }) {
  return (
    <Link to={to} className={moreLinkClass}>
      {children}
      <ChevronRight aria-hidden className="size-4" />
    </Link>
  );
}

export function HomePage() {
  const orders = useOrders();
  const programs = usePrograms();

  return (
    <div className="flex flex-col gap-10">
      <section className="on-dark relative overflow-hidden rounded-banner bg-brand-red p-6 text-white tablet:p-12">
        <SignalRings className="pointer-events-none absolute -right-10 -bottom-10 size-72 text-white opacity-20 tablet:size-96" />
        <div className="relative max-w-xl">
          <h1 className="text-3xl leading-tight font-extrabold tablet:text-4xl">
            Belanja paket untuk outlet Anda
          </h1>
          <p className="mt-3 text-white/90">
            Isi jumlah per paket di tabel pemesanan, periksa total tagihan, lalu ajukan order.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/abkshop" className={buttonClass({ variant: 'inverse' })}>
              Buka ABKShop
            </Link>
            <Link to="/pesanan" className={buttonClass({ variant: 'on-dark' })}>
              Lihat pesanan
            </Link>
          </div>
        </div>
      </section>

      <ul className="grid grid-cols-2 gap-3 desktop:grid-cols-4 desktop:gap-4">
        {tasks.map((task) => (
          <li key={task.to}>
            <Link
              to={task.to}
              className={cn(
                cardClass,
                'flex h-full flex-col gap-3 p-4 hover:border-brand-red tablet:flex-row tablet:items-center',
              )}
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

      <div className="grid gap-10 desktop:grid-cols-2 desktop:gap-8">
        <section aria-labelledby="pesanan-terakhir">
          <SectionHeading
            id="pesanan-terakhir"
            size="sm"
            title="Pesanan terakhir"
            aside={
              <>
                {orders.data ? <DataNotice meta={orders.data.meta} /> : null}
                <MoreLink to="/pesanan">Semua pesanan</MoreLink>
              </>
            }
          />
          <div className="mt-4">
            <AsyncView
              state={orders}
              errorTitle="Pesanan tidak dapat dimuat"
              loadingLabel="Memuat pesanan"
            >
              {(envelope) =>
                envelope.data.length === 0 ? (
                  <EmptyState
                    title="Belum ada pesanan"
                    description="Order pertama Anda akan muncul di sini."
                  />
                ) : (
                  <ul className={cn(cardClass, 'divide-y divide-surface-100 overflow-hidden')}>
                    {envelope.data.slice(0, 3).map((order) => (
                      <li key={order.id}>
                        <Link
                          to={`/pesanan/${order.id}`}
                          className="flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3 hover:bg-surface-50"
                        >
                          <span className="font-semibold">{order.number}</span>
                          <span className="flex items-center gap-3">
                            <OrderStatusBadge status={order.status} />
                            <span className="text-sm font-semibold">
                              {formatRupiah(order.totalRupiah)}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )
              }
            </AsyncView>
          </div>
        </section>

        <section aria-labelledby="program-berjalan">
          <SectionHeading
            id="program-berjalan"
            size="sm"
            title="Program untuk outlet"
            aside={
              <>
                {programs.data ? <DataNotice meta={programs.data.meta} /> : null}
                <MoreLink to="/program">Semua program</MoreLink>
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
    </div>
  );
}
