import { AsyncView, DataNotice, EmptyState, formatDate, formatRupiah } from '@agrabudi/ui';
import { Calculator, Megaphone, ReceiptText, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router';
import { useOrders, usePrograms } from '../../data/queries';
import { OrderStatusBadge } from '../orders/status';

const tasks = [
  {
    to: '/abkshop',
    label: 'Beli paket di ABKShop',
    note: 'Isi jumlah per paket, lihat total, lalu checkout.',
    icon: ShoppingCart,
  },
  {
    to: '/pesanan',
    label: 'Cek status pesanan',
    note: 'Status order dan status pembayaran ditampilkan terpisah.',
    icon: ReceiptText,
  },
  {
    to: '/program',
    label: 'Lihat promo & program',
    note: 'Periode dan syarat program untuk mitra outlet.',
    icon: Megaphone,
  },
  {
    to: '/kalkulator',
    label: 'Kalkulator Cuan',
    note: 'Simulasi keuntungan. Menunggu rumus resmi.',
    icon: Calculator,
  },
];

export function HomePage() {
  const orders = useOrders();
  const programs = usePrograms();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold tablet:text-3xl">Mau mengerjakan apa hari ini?</h1>

      <ul className="grid gap-px overflow-hidden rounded-panel border border-surface-100 bg-surface-100 tablet:grid-cols-2">
        {tasks.map((task) => (
          <li key={task.to} className="bg-surface-0">
            <Link to={task.to} className="flex min-h-20 items-center gap-4 p-4 hover:bg-surface-50">
              <task.icon aria-hidden className="size-6 shrink-0 text-brand-red" />
              <span>
                <span className="block font-semibold">{task.label}</span>
                <span className="block text-sm text-ink-700">{task.note}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid gap-8 desktop:grid-cols-2">
        <section aria-labelledby="pesanan-terakhir">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="pesanan-terakhir" className="text-lg font-bold">
              Pesanan terakhir
            </h2>
            {orders.data ? <DataNotice meta={orders.data.meta} /> : null}
          </div>
          <div className="mt-3">
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
                  <ul className="divide-y divide-surface-100 border-y border-surface-100">
                    {envelope.data.slice(0, 3).map((order) => (
                      <li key={order.id}>
                        <Link
                          to={`/pesanan/${order.id}`}
                          className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 hover:bg-surface-50"
                        >
                          <span className="font-semibold">{order.number}</span>
                          <span className="flex items-center gap-3">
                            <OrderStatusBadge status={order.status} />
                            <span className="text-sm font-medium">
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="program-berjalan" className="text-lg font-bold">
              Program untuk outlet
            </h2>
            {programs.data ? <DataNotice meta={programs.data.meta} /> : null}
          </div>
          <div className="mt-3">
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
                  <ul className="divide-y divide-surface-100 border-y border-surface-100">
                    {envelope.data.slice(0, 3).map((program) => (
                      <li key={program.id}>
                        <Link
                          to={`/program/${program.slug}`}
                          className="flex min-h-14 flex-col justify-center py-3 hover:bg-surface-50"
                        >
                          <span className="font-semibold">{program.title}</span>
                          <span className="text-sm text-ink-700">
                            Sampai {formatDate(program.endsAt)}
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
      </div>
    </div>
  );
}
