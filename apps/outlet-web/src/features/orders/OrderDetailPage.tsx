import {
  AsyncView,
  DataNotice,
  EmptyState,
  PageHeader,
  StatusIcon,
  TableScroll,
  buttonClass,
  formatDateTime,
  formatRupiah,
  tableClass,
  tdClass,
  thClass,
} from '@agrabudi/ui';
import { Link, useLocation, useParams } from 'react-router';
import { RequireOutlet } from '../../auth/RequireOutlet';
import { useOrder } from '../../data/queries';
import { OrderStatusBadge, PaymentStatusBadge } from './status';

export function OrderDetailPage() {
  return (
    <RequireOutlet
      title="Detail pesanan"
      reason="Detail pesanan hanya bisa dilihat oleh outlet pemiliknya. Masuk dengan ID Digipos untuk melihatnya."
    >
      {(session) => <OrderDetail digiposId={session.digiposId} />}
    </RequireOutlet>
  );
}

function OrderDetail({ digiposId }: { digiposId: string }) {
  const { id = '' } = useParams();
  const order = useOrder(digiposId, id);
  const location = useLocation();
  const justCreated =
    typeof location.state === 'object' &&
    location.state !== null &&
    'justCreated' in location.state;
  return (
    <div className="flex flex-col gap-6">
      <Link to="/pesanan" className="text-sm font-medium text-info underline">
        Kembali ke daftar pesanan
      </Link>
      <AsyncView
        state={order}
        errorTitle="Detail pesanan tidak dapat dimuat"
        loadingLabel="Memuat detail pesanan"
      >
        {(envelope) => {
          const detail = envelope.data;
          if (!detail) {
            return (
              <EmptyState
                title="Pesanan tidak ditemukan"
                description="Nomor ini tidak ada di riwayat outlet Anda."
                action={
                  <Link to="/pesanan" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
                    Lihat semua pesanan
                  </Link>
                }
              />
            );
          }
          return (
            <>
              {justCreated ? (
                <div
                  role="status"
                  className="flex items-start gap-2 rounded-panel border border-success bg-success-soft p-4 text-sm"
                >
                  <StatusIcon tone="success" className="mt-0.5 size-5 shrink-0 text-success" />
                  <p>
                    <strong>Order diajukan.</strong> Simpan nomor {detail.number}. Admin akan
                    memverifikasi order ini; status pembayaran diinformasikan terpisah.
                  </p>
                </div>
              ) : null}
              <PageHeader
                title={`Pesanan ${detail.number}`}
                description={`Diajukan ${formatDateTime(detail.createdAt)}`}
                aside={<DataNotice meta={envelope.meta} />}
              />
              <dl className="grid gap-4 rounded-panel border border-surface-100 p-4 tablet:grid-cols-3">
                <div>
                  <dt className="text-xs text-ink-700">Status order</dt>
                  <dd className="mt-1">
                    <OrderStatusBadge status={detail.status} />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-700">Status pembayaran</dt>
                  <dd className="mt-1">
                    <PaymentStatusBadge status={detail.paymentStatus} />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-700">Total</dt>
                  <dd className="mt-1 font-display text-lg font-bold">
                    {formatRupiah(detail.totalRupiah)}
                  </dd>
                </div>
              </dl>
              <TableScroll
                label="Isi pesanan"
                scrollHint="Geser tabel ke samping untuk melihat subtotal."
              >
                <table className={`${tableClass} min-w-[34rem]`}>
                  <thead>
                    <tr>
                      <th scope="col" className={thClass}>
                        Paket saat dipesan
                      </th>
                      <th scope="col" className={`${thClass} text-right`}>
                        Harga per paket
                      </th>
                      <th scope="col" className={`${thClass} text-right`}>
                        Jumlah
                      </th>
                      <th scope="col" className={`${thClass} text-right`}>
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items.map((item) => (
                      <tr key={item.packageId}>
                        <th scope="row" className={`${tdClass} text-left`}>
                          <span className="font-semibold">{item.nameSnapshot}</span>
                          <span className="mt-1 block text-xs font-normal text-ink-700">
                            {item.contentsSnapshot}
                          </span>
                        </th>
                        <td className={`${tdClass} text-right whitespace-nowrap`}>
                          {formatRupiah(item.unitPriceRupiah)}
                        </td>
                        <td className={`${tdClass} text-right`}>{item.qty}</td>
                        <td className={`${tdClass} text-right font-medium whitespace-nowrap`}>
                          {formatRupiah(item.lineTotalRupiah)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
            </>
          );
        }}
      </AsyncView>
    </div>
  );
}
