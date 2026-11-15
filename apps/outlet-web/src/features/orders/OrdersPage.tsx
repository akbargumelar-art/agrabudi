import {
  AsyncView,
  DataNotice,
  EmptyState,
  PageHeader,
  TableScroll,
  buttonClass,
  formatDateTime,
  formatRupiah,
  tableClass,
  tdClass,
  thClass,
} from '@agrabudi/ui';
import { Link } from 'react-router';
import { useOrders } from '../../data/queries';
import { OrderStatusBadge, PaymentStatusBadge } from './status';

export function OrdersPage() {
  const orders = useOrders();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pesanan"
        description="Riwayat order outlet Anda beserta status order dan status pembayarannya."
        aside={orders.data ? <DataNotice meta={orders.data.meta} /> : null}
      />
      <AsyncView
        state={orders}
        errorTitle="Riwayat pesanan tidak dapat dimuat"
        loadingLabel="Memuat pesanan"
      >
        {(envelope) =>
          envelope.data.length === 0 ? (
            <EmptyState
              title="Belum ada pesanan"
              description="Order yang Anda ajukan dari ABKShop akan muncul di sini."
              action={
                <Link to="/abkshop" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
                  Buka ABKShop
                </Link>
              }
            />
          ) : (
            <TableScroll
              label="Riwayat pesanan"
              scrollHint="Geser tabel ke samping untuk melihat status dan total."
            >
              <table className={`${tableClass} min-w-[42rem]`}>
                <thead>
                  <tr>
                    <th scope="col" className={thClass}>
                      Nomor order
                    </th>
                    <th scope="col" className={thClass}>
                      Diajukan
                    </th>
                    <th scope="col" className={thClass}>
                      Status order
                    </th>
                    <th scope="col" className={thClass}>
                      Status pembayaran
                    </th>
                    <th scope="col" className={`${thClass} text-right`}>
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {envelope.data.map((order) => (
                    <tr key={order.id}>
                      <th scope="row" className={`${tdClass} text-left`}>
                        <Link
                          to={`/pesanan/${order.id}`}
                          className="font-semibold text-info underline"
                        >
                          {order.number}
                        </Link>
                      </th>
                      <td className={`${tdClass} whitespace-nowrap`}>
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className={tdClass}>
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className={tdClass}>
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </td>
                      <td className={`${tdClass} text-right font-medium whitespace-nowrap`}>
                        {formatRupiah(order.totalRupiah)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )
        }
      </AsyncView>
    </div>
  );
}
