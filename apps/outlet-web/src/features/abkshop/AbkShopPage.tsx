import type { DataEnvelope, OutletCatalog, OutletPackage } from '@agrabudi/contracts';
import {
  AsyncView,
  Button,
  DataNotice,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  TableScroll,
  buttonClass,
  formatRupiah,
  tableClass,
  tdClass,
  thClass,
  useToast,
} from '@agrabudi/ui';
import { ImageOff } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { RequireOutlet } from '../../auth/RequireOutlet';
import { useCatalog } from '../../data/queries';
import { useCart } from './CartContext';
import { checkQty, summarizeCart } from './cart-math';
import { QuantityInput } from './QuantityInput';

export function AbkShopPage() {
  return (
    <RequireOutlet
      title="ABKShop Outlet"
      reason="Harga paket ABKShop hanya untuk mitra outlet terdaftar. Masuk dengan ID Digipos untuk melihat katalog dan memesan."
    >
      {() => <Catalog />}
    </RequireOutlet>
  );
}

/** Katalog paket khusus mitra. Terpisah dari ABKShop Pelanggan; tidak ada fallback harga (PRD K-06). */
function Catalog() {
  const catalog = useCatalog();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="ABKShop Outlet"
        description="Isi jumlah di tiap paket yang ingin dibeli, lalu lanjut ke checkout. Jumlah kosong atau 0 berarti paket tidak dipilih."
        aside={catalog.data ? <DataNotice meta={catalog.data.meta} /> : null}
      />
      <AsyncView
        state={catalog}
        errorTitle="Katalog paket tidak dapat dimuat"
        loadingLabel="Memuat katalog paket"
      >
        {(envelope) => <PurchaseTable envelope={envelope} />}
      </AsyncView>
    </div>
  );
}

function PurchaseTable({ envelope }: { envelope: DataEnvelope<OutletCatalog> }) {
  const { categories, packages } = envelope.data;
  const { quantities, setQuantity, clear } = useCart();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const summary = useMemo(() => summarizeCart(packages, quantities), [packages, quantities]);

  const visible = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return packages.filter((pkg) => {
      const inCategory = categoryId === '' || pkg.categoryId === categoryId;
      const inSearch =
        keyword === '' ||
        `${pkg.name} ${pkg.description} ${pkg.contents}`.toLowerCase().includes(keyword);
      return inCategory && inSearch;
    });
  }, [packages, search, categoryId]);

  const visibleIds = new Set(visible.map((pkg) => pkg.id));
  const hiddenSelected = summary.lines.filter((line) => !visibleIds.has(line.pkg.id)).length;
  const hasAnyInput = Object.keys(quantities).length > 0;

  if (packages.length === 0) {
    return (
      <EmptyState
        title="Belum ada paket untuk outlet Anda"
        description="Paket muncul di sini setelah diterbitkan Admin."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 tablet:grid-cols-[minmax(0,1fr)_16rem]">
        <Field label="Cari paket" htmlFor="cari-paket">
          <Input
            id="cari-paket"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nama atau isi paket"
          />
        </Field>
        <Field label="Kategori" htmlFor="kategori-paket">
          <Select
            id="kategori-paket"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">Semua kategori</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {hiddenSelected > 0 ? (
        <p data-testid="hidden-selected" className="text-sm text-ink-700">
          {hiddenSelected} paket terpilih tidak tampil karena filter, tetapi tetap dihitung di
          total.
        </p>
      ) : null}

      {visible.length === 0 ? (
        <EmptyState
          title="Tidak ada paket yang cocok"
          description="Ubah kata kunci atau kategori. Pilihan yang sudah diisi tidak hilang."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearch('');
                setCategoryId('');
              }}
            >
              Hapus filter
            </Button>
          }
        />
      ) : (
        <TableScroll
          label="Tabel pembelian paket"
          scrollHint="Geser tabel ke samping untuk melihat harga dan jumlah."
        >
          <table className={`${tableClass} min-w-[46rem]`}>
            <thead>
              <tr>
                <th scope="col" className={thClass}>
                  Foto
                </th>
                <th scope="col" className={thClass}>
                  Nama paket
                </th>
                <th scope="col" className={thClass}>
                  Deskripsi dan isi
                </th>
                <th scope="col" className={`${thClass} text-right`}>
                  Harga per paket
                </th>
                <th scope="col" className={thClass}>
                  Jumlah beli
                </th>
                <th scope="col" className={`${thClass} text-right`}>
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((pkg) => (
                <PackageRow
                  key={pkg.id}
                  pkg={pkg}
                  raw={quantities[pkg.id] ?? ''}
                  onChange={(raw) => setQuantity(pkg.id, raw)}
                />
              ))}
            </tbody>
          </table>
        </TableScroll>
      )}

      <section
        aria-label="Ringkasan tagihan"
        data-testid="ringkasan"
        className="rounded-panel border border-surface-100 bg-surface-50 p-4 tablet:p-6"
      >
        <div className="grid gap-6 tablet:grid-cols-[minmax(0,1fr)_18rem] tablet:items-end">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-ink-700">Jenis paket</dt>
            <dd data-testid="jenis-paket" className="text-right font-medium">
              {summary.distinctCount}
            </dd>
            <dt className="text-ink-700">Total jumlah paket</dt>
            <dd data-testid="total-paket" className="text-right font-medium">
              {summary.totalQty}
            </dd>
            <dt className="text-ink-700">Subtotal barang</dt>
            <dd data-testid="subtotal" className="text-right font-medium">
              {formatRupiah(summary.subtotalRupiah)}
            </dd>
            <dt className="text-ink-700">Diskon, ongkir, pajak</dt>
            <dd className="text-right text-ink-700">Dihitung saat checkout</dd>
            <div className="col-span-2 flex items-baseline justify-between gap-6 border-t border-ink-300 pt-2">
              <dt className="font-semibold">Total estimasi</dt>
              <dd
                data-testid="total-estimasi"
                className="font-display text-xl font-bold text-brand-red-strong"
              >
                {formatRupiah(summary.subtotalRupiah)}
              </dd>
            </div>
          </dl>
          <div className="flex flex-col gap-2">
            {summary.canCheckout ? (
              <Link to="/checkout" className={buttonClass({ block: true })}>
                Checkout
              </Link>
            ) : (
              <Button block disabled aria-describedby="alasan-checkout">
                Checkout
              </Button>
            )}
            <p id="alasan-checkout" className="text-xs text-ink-700">
              {summary.invalidIds.length > 0
                ? 'Perbaiki jumlah yang ditandai merah untuk melanjutkan.'
                : summary.distinctCount === 0
                  ? 'Isi jumlah minimal satu paket untuk melanjutkan.'
                  : 'Total masih estimasi. Harga final dikonfirmasi saat checkout.'}
            </p>
            <Button
              variant="ghost"
              size="sm"
              disabled={!hasAnyInput}
              onClick={() => {
                clear();
                toast.show({ tone: 'info', message: 'Semua jumlah dikosongkan.' });
              }}
            >
              Kosongkan semua jumlah
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function PackageRow({
  pkg,
  raw,
  onChange,
}: {
  pkg: OutletPackage;
  raw: string;
  onChange: (raw: string) => void;
}) {
  const check = checkQty(raw, pkg);
  const lineTotal = check.valid ? check.qty * pkg.unitPriceRupiah : 0;
  const rules = [
    pkg.minQty > 1 ? `min. ${pkg.minQty}` : null,
    pkg.multipleOf > 1 ? `kelipatan ${pkg.multipleOf}` : null,
    pkg.maxQty !== null ? `maks. ${pkg.maxQty}` : null,
  ].filter(Boolean);

  return (
    <tr
      data-package-id={pkg.id}
      className={check.valid && check.qty > 0 ? 'bg-brand-red-soft' : 'bg-surface-0'}
    >
      <td className={tdClass}>
        {pkg.thumbnailUrl ? (
          <img
            src={pkg.thumbnailUrl}
            alt={`Foto ${pkg.name}`}
            width={64}
            height={64}
            loading="lazy"
            className="size-16 rounded-control object-cover"
          />
        ) : (
          <div
            role="img"
            aria-label={`Foto ${pkg.name} belum tersedia`}
            className="flex size-16 flex-col items-center justify-center gap-0.5 rounded-control border border-dashed border-ink-300 bg-surface-50 px-1 text-center text-ink-500"
          >
            <ImageOff aria-hidden className="size-4" />
            <span className="text-xs leading-none">Tanpa foto</span>
          </div>
        )}
      </td>
      <th
        scope="row"
        className={`${tdClass} sticky left-0 z-10 min-w-32 border-r bg-inherit text-left font-semibold tablet:static tablet:border-r-0`}
      >
        {pkg.name}
      </th>
      <td className={`${tdClass} min-w-48 text-ink-700`}>
        <p>{pkg.description}</p>
        <p className="mt-1 text-xs">{pkg.contents}</p>
        {rules.length > 0 ? (
          <p className="mt-1 text-xs text-ink-500">Aturan beli: {rules.join(', ')}</p>
        ) : null}
      </td>
      <td className={`${tdClass} text-right whitespace-nowrap`}>
        {formatRupiah(pkg.unitPriceRupiah)}
      </td>
      <td className={tdClass}>
        <QuantityInput pkg={pkg} raw={raw} onChange={onChange} />
      </td>
      <td
        data-testid={`subtotal-${pkg.id}`}
        className={`${tdClass} text-right font-medium whitespace-nowrap`}
      >
        {check.valid && check.qty > 0 ? formatRupiah(lineTotal) : '-'}
      </td>
    </tr>
  );
}
