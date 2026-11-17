import {
  AsyncView,
  DataNotice,
  EmptyState,
  PageHeader,
  StatusBadge,
  TableScroll,
  buttonClass,
  formatRupiah,
  tableClass,
  tdClass,
  thClass,
} from '@agrabudi/ui';
import { Link } from 'react-router';
import { RequireOutlet } from '../../auth/RequireOutlet';
import { useCatalog } from '../../data/queries';
import { useCart } from '../abkshop/CartContext';
import { summarizeCart } from '../abkshop/cart-math';
import { SubmitOrder } from './SubmitOrder';

export function CheckoutPage() {
  return (
    <RequireOutlet
      title="Checkout"
      reason="Checkout hanya untuk mitra outlet terdaftar. Masuk dengan ID Digipos untuk meninjau pesanan."
    >
      {(session) => <CheckoutReview digiposId={session.digiposId} />}
    </RequireOutlet>
  );
}

function CheckoutReview({ digiposId }: { digiposId: string }) {
  const catalog = useCatalog();
  const { quantities } = useCart();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Checkout"
        description="Periksa paket dan jumlah sebelum order diajukan."
        aside={catalog.data ? <DataNotice meta={catalog.data.meta} /> : null}
      />
      <AsyncView state={catalog} errorTitle="Katalog paket tidak dapat dimuat">
        {(envelope) => {
          const summary = summarizeCart(envelope.data.packages, quantities);
          if (summary.invalidIds.length > 0) {
            return (
              <EmptyState
                title="Ada jumlah yang belum valid"
                description="Kembali ke ABKShop dan perbaiki jumlah yang ditandai merah."
                action={
                  <Link to="/abkshop" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
                    Kembali ke ABKShop
                  </Link>
                }
              />
            );
          }
          if (summary.lines.length === 0) {
            return (
              <EmptyState
                title="Belum ada paket yang dipilih"
                description="Isi jumlah paket di ABKShop terlebih dahulu."
                action={
                  <Link to="/abkshop" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
                    Pilih paket di ABKShop
                  </Link>
                }
              />
            );
          }
          return (
            <div className="grid gap-6 desktop:grid-cols-[minmax(0,1fr)_22rem] desktop:items-start">
              <TableScroll
                label="Paket yang akan dipesan"
                scrollHint="Geser tabel ke samping untuk melihat subtotal."
              >
                <table className={`${tableClass} min-w-[34rem]`}>
                  <thead>
                    <tr>
                      <th scope="col" className={thClass}>
                        Paket
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
                    {summary.lines.map((line) => (
                      <tr key={line.pkg.id}>
                        <th scope="row" className={`${tdClass} text-left`}>
                          <span className="font-semibold">{line.pkg.name}</span>
                          <span className="mt-1 block text-xs font-normal text-ink-700">
                            {line.pkg.contents}
                          </span>
                        </th>
                        <td className={`${tdClass} text-right whitespace-nowrap`}>
                          {formatRupiah(line.pkg.unitPriceRupiah)}
                        </td>
                        <td className={`${tdClass} text-right`}>{line.qty}</td>
                        <td className={`${tdClass} text-right font-medium whitespace-nowrap`}>
                          {formatRupiah(line.lineTotalRupiah)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>

              <section
                aria-label="Tagihan"
                className="rounded-panel border border-surface-100 bg-surface-50 p-4 tablet:p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-bold">Tagihan</h2>
                  <StatusBadge tone="warning">Estimasi</StatusBadge>
                </div>
                <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                  <dt className="text-ink-700">Jenis paket</dt>
                  <dd className="text-right font-medium">{summary.distinctCount}</dd>
                  <dt className="text-ink-700">Total jumlah paket</dt>
                  <dd className="text-right font-medium">{summary.totalQty}</dd>
                  <dt className="text-ink-700">Subtotal barang</dt>
                  <dd className="text-right font-medium">{formatRupiah(summary.subtotalRupiah)}</dd>
                  <dt className="text-ink-700">Diskon</dt>
                  <dd className="text-right text-ink-700">Belum dihitung</dd>
                  <dt className="text-ink-700">Ongkir dan pajak</dt>
                  <dd className="text-right text-ink-700">Belum ditentukan</dd>
                  <div className="col-span-2 flex items-baseline justify-between gap-6 border-t border-ink-300 pt-2">
                    <dt className="font-semibold">Total estimasi</dt>
                    <dd
                      data-testid="checkout-total"
                      className="font-display text-xl font-bold text-brand-red-strong"
                    >
                      {formatRupiah(summary.subtotalRupiah)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-4 text-xs text-ink-700">
                  Angka di atas estimasi dari browser. Harga dan aturan jumlah yang mengikat
                  dihitung server saat Anda memeriksa harga final.
                </p>
                <SubmitOrder
                  digiposId={digiposId}
                  lines={summary.lines}
                  estimateRupiah={summary.subtotalRupiah}
                />
                <Link
                  to="/abkshop"
                  className={`${buttonClass({ variant: 'ghost', size: 'sm' })} mt-2 w-full`}
                >
                  Ubah pilihan
                </Link>
              </section>
            </div>
          );
        }}
      </AsyncView>
    </div>
  );
}
