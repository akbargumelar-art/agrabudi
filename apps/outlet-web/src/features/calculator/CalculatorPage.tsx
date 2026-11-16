import { cuanProfit, type CuanContact, type CuanProduct } from '@agrabudi/contracts';
import {
  AsyncView,
  Button,
  DataNotice,
  EmptyState,
  Input,
  Select,
  buttonClass,
  cardClass,
  cn,
  formatRupiah,
  useToast,
} from '@agrabudi/ui';
import {
  CheckCircle2,
  Download,
  Flame,
  MessageCircle,
  Minus,
  Plus,
  RotateCcw,
  Search,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCuanContact, useCuanProducts } from '../../data/queries';
import { saveFile } from '../../lib/saveFile';

/**
 * Kalkulator Cuan, mengikuti halaman /cuan di repo landing:
 * - keuntungan per unit = harga jual - harga modal + cashback;
 * - mode Rekomendasi: urutkan produk menurut rasio untung terhadap modal, lalu ambil
 *   sebanyak mungkin dari yang teratas selama modal cukup (greedy);
 * - mode Pilih Sendiri: tambah dan kurangi jumlah per produk, dibatasi sisa modal.
 * Hasilnya simulasi, bukan janji keuntungan. Harga di mode contoh juga contoh.
 */
type Line = { product: CuanProduct; qty: number };
type Mode = 'rekomendasi' | 'pilih';

const MAX_MODAL = 1_000_000_000;

const ratio = (product: CuanProduct) =>
  product.capitalPrice > 0 ? cuanProfit(product) / product.capitalPrice : 0;

const percent = (profit: number, capital: number) =>
  capital > 0 ? `${((profit / capital) * 100).toLocaleString('id-ID', { maximumFractionDigits: 1 })}%` : '-';

export function recommend(
  products: CuanProduct[],
  modal: number,
  filter: { categories: Set<string>; brands: Set<string>; hotOnly: boolean },
): Line[] {
  const candidates = products
    .filter((product) => {
      if (product.capitalPrice <= 0 || product.capitalPrice > modal) return false;
      if (filter.categories.size > 0 && !filter.categories.has(product.categoryId)) return false;
      if (filter.brands.size > 0 && !filter.brands.has(product.brandId)) return false;
      if (filter.hotOnly && !product.isHot) return false;
      return true;
    })
    .sort((a, b) => ratio(b) - ratio(a));
  let remaining = modal;
  const result: Line[] = [];
  for (const product of candidates) {
    const qty = Math.floor(remaining / product.capitalPrice);
    if (qty > 0) {
      result.push({ product, qty });
      remaining -= qty * product.capitalPrice;
    }
    if (remaining <= 0) break;
  }
  return result;
}

export function summarize(lines: Line[], modal: number) {
  const capital = lines.reduce((total, line) => total + line.product.capitalPrice * line.qty, 0);
  const profit = lines.reduce((total, line) => total + cuanProfit(line.product) * line.qty, 0);
  const units = lines.reduce((total, line) => total + line.qty, 0);
  return { capital, profit, units, remaining: modal - capital };
}

function unique(products: CuanProduct[], key: 'category' | 'brand') {
  const map = new Map<string, string>();
  for (const product of products) {
    if (key === 'category') map.set(product.categoryId, product.categoryName);
    else map.set(product.brandId, product.brandName);
  }
  return [...map].map(([id, name]) => ({ id, name }));
}

export function CalculatorPage() {
  const products = useCuanProducts();
  const contact = useCuanContact();
  const [modalText, setModalText] = useState('');
  const modal = Number(modalText.replace(/\D/g, '')) || 0;

  return (
    <div className="flex flex-col">
      <section className="relative -mx-4 -mt-6 overflow-hidden bg-brand-red px-4 pt-10 pb-24 text-white tablet:mx-0 tablet:mt-0 tablet:rounded-panel tablet:px-6 desktop:pt-14 desktop:pb-28">
        <span aria-hidden className="absolute -top-20 -right-16 size-72 rounded-full bg-white/10" />
        <span aria-hidden className="absolute -bottom-28 left-1/3 size-80 rounded-full bg-brand-red-strong/40" />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold">
            <Sparkles aria-hidden className="size-4" />
            Fitur DigiposAja
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight desktop:text-6xl">
            Kalkulator <span className="text-brand-gold">Cuan</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-white/85 desktop:text-lg">
            Masukkan modal, pilih produk atau minta rekomendasi, lalu lihat perkiraan keuntunganmu dari transaksi
            DigiposAja.
          </p>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-16 w-full max-w-3xl">
        <div className="overflow-hidden rounded-panel bg-ink-900 shadow-raised">
          <div className="flex items-center gap-3 px-5 pt-5 pb-3 text-white">
            <span className="flex size-11 items-center justify-center rounded-control bg-white/10">
              <Wallet aria-hidden className="size-5" />
            </span>
            <span>
              <label htmlFor="modal-awal" className="block text-base font-bold">
                Modal awal (Rp)
              </label>
              <span id="modal-awal-hint" className="block text-sm text-white/70">
                Isi modal dulu sebelum mulai hitung cuan.
              </span>
            </span>
          </div>
          <div className="rounded-t-panel bg-surface-0 px-3 pt-3 pb-4">
            <div className="relative">
              <span aria-hidden className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-2xl font-extrabold text-ink-500">
                Rp
              </span>
              <input
                id="modal-awal"
                inputMode="numeric"
                autoComplete="off"
                aria-describedby="modal-awal-hint"
                placeholder="500.000"
                value={modalText}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, '').replace(/^0+/, '');
                  const value = Math.min(Number(digits) || 0, MAX_MODAL);
                  setModalText(value > 0 ? value.toLocaleString('id-ID') : '');
                }}
                className="h-16 w-full rounded-control border border-surface-100 bg-surface-0 pr-4 pl-14 text-2xl font-extrabold text-ink-900 tabular-nums placeholder:text-ink-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red desktop:h-[4.5rem] desktop:text-3xl"
              />
            </div>
            {modal > 0 ? (
              <p className="px-2 pt-3 text-sm font-semibold text-brand-red" data-testid="modal-aktif">
                Modal aktif: {formatRupiah(modal)}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-6">
        {products.data ? (
          <div className="flex justify-center">
            <DataNotice meta={products.data.meta} />
          </div>
        ) : null}
        {modal <= 0 ? (
          <EmptyState
            title="Masukkan modal awal"
            description="Isi nominal modal di atas untuk mulai menghitung potensi keuntungan dari transaksi DigiposAja."
          />
        ) : (
          <AsyncView state={products} errorTitle="Daftar produk tidak dapat dimuat" loadingLabel="Memuat produk">
            {(envelope) => (
              <Simulator
                products={envelope.data}
                modal={modal}
                contact={contact.data?.data ?? null}
                onReset={() => setModalText('')}
              />
            )}
          </AsyncView>
        )}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors',
        active
          ? 'border-brand-red bg-brand-red text-white'
          : 'border-surface-100 bg-surface-0 text-ink-700 hover:border-ink-300',
      )}
    >
      {children}
    </button>
  );
}

function Simulator({
  products,
  modal,
  contact,
  onReset,
}: {
  products: CuanProduct[];
  modal: number;
  contact: CuanContact | null;
  onReset: () => void;
}) {
  const [mode, setMode] = useState<Mode>('rekomendasi');
  const [recommended, setRecommended] = useState<Line[] | null>(null);
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [categories, setCategories] = useState<Set<string>>(new Set());
  const [brands, setBrands] = useState<Set<string>>(new Set());
  const [hotOnly, setHotOnly] = useState(false);

  const cartLines = useMemo(
    () =>
      [...cart]
        .map(([id, qty]) => ({ product: products.find((item) => item.id === id), qty }))
        .filter((line): line is Line => line.product !== undefined),
    [cart, products],
  );
  const lines = mode === 'rekomendasi' ? (recommended ?? []) : cartLines;
  const summary = summarize(lines, modal);
  const cartSummary = summarize(cartLines, modal);

  // Modal turun di bawah rekomendasi lama: hitung ulang supaya hasil tidak melebihi modal.
  const stale = recommended !== null && summarize(recommended, modal).remaining < 0;

  const toggle = (set: Set<string>, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };

  function resetAll() {
    setRecommended(null);
    setCart(new Map());
    setCategories(new Set());
    setBrands(new Set());
    setHotOnly(false);
    onReset();
  }

  const allBrands = unique(products, 'brand');
  const allCategories = unique(products, 'category');
  const filterCount = categories.size + brands.size + (hotOnly ? 1 : 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Mode hitung">
        <Button
          variant={mode === 'rekomendasi' ? 'primary' : 'secondary'}
          aria-pressed={mode === 'rekomendasi'}
          onClick={() => {
            setMode('rekomendasi');
            setRecommended(null);
          }}
        >
          <Sparkles aria-hidden className="size-4" />
          Rekomendasi Cuan Maksimal
        </Button>
        <Button
          variant={mode === 'pilih' ? 'primary' : 'secondary'}
          aria-pressed={mode === 'pilih'}
          onClick={() => {
            setMode('pilih');
            setCart(new Map());
          }}
        >
          <ShoppingCart aria-hidden className="size-4" />
          Pilih Sendiri
        </Button>
        <Button variant="ghost" onClick={resetAll}>
          <RotateCcw aria-hidden className="size-4" />
          Reset
        </Button>
      </div>

      <div className="grid gap-6 desktop:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)] desktop:items-start">
        <div className="min-w-0">
          {mode === 'rekomendasi' ? (
            recommended === null || stale ? (
              <section aria-labelledby="siap-hitung" className={cn(cardClass, 'flex flex-col gap-6 p-5 tablet:p-8')}>
                <div className="text-center">
                  <h2 id="siap-hitung" className="text-xl font-bold">
                    Siap hitung cuan?
                  </h2>
                  <p className="mx-auto mt-2 max-w-md text-sm text-ink-700">
                    {stale ? 'Modal berubah. Hitung ulang supaya rekomendasi sesuai modal ' : 'Sistem mencarikan kombinasi produk dengan keuntungan terbesar untuk modal '}
                    <span className="font-bold text-brand-red">{formatRupiah(modal)}</span>.
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-center gap-3 text-sm">
                    <span className="font-semibold text-ink-700">Filter opsional</span>
                    {filterCount > 0 ? (
                      <button
                        type="button"
                        className="min-h-10 font-semibold text-brand-red underline"
                        onClick={() => {
                          setCategories(new Set());
                          setBrands(new Set());
                          setHotOnly(false);
                        }}
                      >
                        Hapus filter ({filterCount})
                      </button>
                    ) : null}
                  </div>
                  <fieldset className="flex flex-col items-center gap-2">
                    <legend className="mb-2 w-full text-center text-sm text-ink-700">
                      Brand{brands.size > 0 ? `, ${brands.size} dipilih` : ''}
                    </legend>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Chip active={brands.size === 0} onClick={() => setBrands(new Set())}>
                        Semua
                      </Chip>
                      {allBrands.map((brand) => (
                        <Chip key={brand.id} active={brands.has(brand.id)} onClick={() => setBrands(toggle(brands, brand.id))}>
                          {brand.name}
                        </Chip>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset className="flex flex-col items-center gap-2">
                    <legend className="mb-2 w-full text-center text-sm text-ink-700">
                      Kategori{categories.size > 0 ? `, ${categories.size} dipilih` : ''}
                    </legend>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Chip active={categories.size === 0} onClick={() => setCategories(new Set())}>
                        Semua
                      </Chip>
                      {allCategories.map((category) => (
                        <Chip
                          key={category.id}
                          active={categories.has(category.id)}
                          onClick={() => setCategories(toggle(categories, category.id))}
                        >
                          {category.name}
                        </Chip>
                      ))}
                    </div>
                  </fieldset>
                  <div className="flex justify-center">
                    <Chip active={hotOnly} onClick={() => setHotOnly(!hotOnly)}>
                      <Flame aria-hidden className="size-4" />
                      Produk unggulan saja
                    </Chip>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <Button
                    className="min-h-12 px-6 text-base"
                    disabled={products.length === 0}
                    onClick={() => setRecommended(recommend(products, modal, { categories, brands, hotOnly }))}
                  >
                    <Sparkles aria-hidden className="size-5" />
                    Hitungkan cuan maksimal
                  </Button>
                  {filterCount > 0 ? (
                    <p className="text-xs text-ink-700">Dihitung hanya dari produk yang sesuai filter.</p>
                  ) : null}
                </div>
              </section>
            ) : recommended.length === 0 ? (
              <EmptyState
                title="Tidak ada produk yang sesuai"
                description={`Modal ${formatRupiah(modal)} belum cukup untuk produk yang sesuai filter. Tambah modal atau longgarkan filter.`}
                action={
                  <Button variant="secondary" onClick={() => setRecommended(null)}>
                    Ubah filter
                  </Button>
                }
              />
            ) : (
              <section aria-labelledby="hasil-rekomendasi" className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 id="hasil-rekomendasi" className="flex items-center gap-2 text-lg font-bold">
                    <CheckCircle2 aria-hidden className="size-5 text-success" />
                    Rekomendasi produk ({recommended.length} jenis)
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => setRecommended(null)}>
                    <RotateCcw aria-hidden className="size-4" />
                    Hitung ulang
                  </Button>
                </div>
                <ol className="flex flex-col gap-3" data-testid="hasil-rekomendasi">
                  {recommended.map((line, index) => (
                    <ResultCard key={line.product.id} line={line} rank={index + 1} />
                  ))}
                </ol>
              </section>
            )
          ) : (
            <ProductPicker
              products={products}
              cart={cart}
              remaining={cartSummary.remaining}
              onChange={(id, qty) =>
                setCart((current) => {
                  const next = new Map(current);
                  if (qty <= 0) next.delete(id);
                  else next.set(id, qty);
                  return next;
                })
              }
            />
          )}
        </div>

        <aside className="flex flex-col gap-4 desktop:sticky desktop:top-24" aria-label="Ringkasan simulasi">
          <SummaryCard modal={modal} summary={lines.length > 0 ? summary : null} />
          {lines.length > 0 ? <ExportButton lines={lines} summary={summary} modal={modal} /> : null}
          {contact ? <ContactCard contact={contact} /> : null}
          <section className={cn(cardClass, 'p-5')} aria-labelledby="tips-cuan">
            <h2 id="tips-cuan" className="text-base font-bold">
              Tips cuan
            </h2>
            <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-sm text-ink-700">
              <li>Pakai mode Rekomendasi untuk kombinasi dengan untung terbesar secara otomatis.</li>
              <li>Pakai mode Pilih Sendiri untuk menyusun belanja sesuai kebutuhan tokomu.</li>
              <li>Unduh hasil simulasi sebagai catatan sebelum belanja.</li>
            </ul>
          </section>
        </aside>
      </div>

      {lines.length > 0 ? (
        <div
          className="sticky bottom-20 z-30 -mx-1 flex items-center justify-between gap-3 rounded-panel bg-ink-900 px-4 py-3 text-white shadow-raised tablet:hidden"
          aria-hidden
        >
          <span className="text-sm">
            Sisa modal
            <span className="block font-bold tabular-nums">{formatRupiah(summary.remaining)}</span>
          </span>
          <span className="text-right text-sm">
            Keuntungan
            <span className="block text-lg font-extrabold text-brand-gold tabular-nums">+{formatRupiah(summary.profit)}</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}

function PriceLine({ product }: { product: CuanProduct }) {
  const profit = cuanProfit(product);
  return (
    <>
      <p className="mt-2 grid grid-cols-2 gap-x-4 text-xs text-ink-700">
        <span>
          Modal <span className="font-semibold text-ink-900 tabular-nums">{formatRupiah(product.capitalPrice)}</span>
        </span>
        <span>
          Jual <span className="font-semibold text-ink-900 tabular-nums">{formatRupiah(product.sellingPrice)}</span>
        </span>
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span className="inline-flex items-center gap-1 font-bold text-success tabular-nums">
          <TrendingUp aria-hidden className="size-3.5" />+{formatRupiah(profit)} per unit
        </span>
        <span className="rounded-full bg-success-soft px-2 py-0.5 font-semibold text-success">
          {percent(profit, product.capitalPrice)}
        </span>
        {product.cashback > 0 ? (
          <span className="text-warning">termasuk cashback {formatRupiah(product.cashback)}</span>
        ) : null}
      </p>
    </>
  );
}

function ProductTitle({ product }: { product: CuanProduct }) {
  return (
    <>
      <h3 className="flex items-center gap-1.5 font-semibold">
        {product.name}
        {product.isHot ? (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning">
            <Flame aria-hidden className="size-3" />
            Unggulan
          </span>
        ) : null}
      </h3>
      <p className="mt-1 flex flex-wrap gap-1.5 text-xs">
        <span className="rounded-full bg-surface-50 px-2 py-0.5 text-ink-700">{product.categoryName}</span>
        <span className="rounded-full bg-brand-red-soft px-2 py-0.5 font-semibold text-brand-red-strong">
          {product.brandName}
        </span>
      </p>
    </>
  );
}

function ResultCard({ line, rank }: { line: Line; rank: number }) {
  const capital = line.product.capitalPrice * line.qty;
  const profit = cuanProfit(line.product) * line.qty;
  return (
    <li className={cn(cardClass, 'flex items-center gap-4 p-4')}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-red text-sm font-bold text-white">
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <ProductTitle product={line.product} />
        <p className="mt-2 flex flex-wrap gap-x-3 text-xs text-ink-700 tabular-nums">
          <span>Modal {formatRupiah(line.product.capitalPrice)}</span>
          <span>Jual {formatRupiah(line.product.sellingPrice)}</span>
          <span className="font-semibold text-ink-900">
            × {line.qty.toLocaleString('id-ID')} = {formatRupiah(capital)}
          </span>
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xs text-ink-700">Keuntungan</p>
        <p className="text-lg font-extrabold text-success tabular-nums">+{formatRupiah(profit)}</p>
        <p className="text-xs font-semibold text-success">{percent(profit, capital)}</p>
      </div>
    </li>
  );
}

function ProductPicker({
  products,
  cart,
  remaining,
  onChange,
}: {
  products: CuanProduct[];
  cart: Map<string, number>;
  remaining: number;
  onChange: (id: string, qty: number) => void;
}) {
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('all');
  const [category, setCategory] = useState('all');

  // Filter saling terkait: pilihan kategori mengikuti brand, dan sebaliknya.
  const brands = unique(category === 'all' ? products : products.filter((item) => item.categoryId === category), 'brand');
  const categories = unique(brand === 'all' ? products : products.filter((item) => item.brandId === brand), 'category');
  const activeBrand = brands.some((item) => item.id === brand) ? brand : 'all';
  const activeCategory = categories.some((item) => item.id === category) ? category : 'all';

  const keyword = search.trim().toLowerCase();
  const visible = products.filter(
    (item) =>
      (activeBrand === 'all' || item.brandId === activeBrand) &&
      (activeCategory === 'all' || item.categoryId === activeCategory) &&
      (!keyword || item.name.toLowerCase().includes(keyword)),
  );

  return (
    <section aria-label="Pilih produk" className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Brand">
        <Chip active={activeBrand === 'all'} onClick={() => setBrand('all')}>
          Semua brand
        </Chip>
        {brands.map((item) => (
          <Chip key={item.id} active={activeBrand === item.id} onClick={() => setBrand(item.id)}>
            {item.name}
          </Chip>
        ))}
      </div>
      <div className="flex flex-col gap-3 tablet:flex-row">
        <div className="relative flex-1">
          <label htmlFor="cari-produk" className="sr-only">
            Cari produk
          </label>
          <Search aria-hidden className="pointer-events-none absolute top-3 left-3 size-5 text-ink-500" />
          <Input
            id="cari-produk"
            type="search"
            placeholder="Cari produk"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-10"
          />
        </div>
        <div className="tablet:w-56">
          <label htmlFor="kategori-produk" className="sr-only">
            Kategori
          </label>
          <Select id="kategori-produk" value={activeCategory} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">Semua kategori</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState title="Produk tidak ditemukan" description="Ubah kata kunci, brand, atau kategori." />
      ) : (
        <ul className="grid gap-3 tablet:grid-cols-2" data-testid="daftar-produk-cuan">
          {visible.map((product) => {
            const qty = cart.get(product.id) ?? 0;
            const tooExpensive = product.capitalPrice > remaining;
            return (
              <li
                key={product.id}
                className={cn(
                  cardClass,
                  'flex items-start gap-3 p-4',
                  qty > 0 && 'border-brand-red bg-brand-red-soft/40',
                  tooExpensive && qty === 0 && 'opacity-60',
                )}
              >
                <div className="min-w-0 flex-1">
                  <ProductTitle product={product} />
                  <PriceLine product={product} />
                  {tooExpensive && qty === 0 ? (
                    <p className="mt-1 text-xs text-ink-700">Sisa modal belum cukup.</p>
                  ) : null}
                </div>
                {qty > 0 ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Kurangi ${product.name} ${product.brandName}`}
                      onClick={() => onChange(product.id, qty - 1)}
                      className="flex size-10 items-center justify-center rounded-full border border-surface-100 bg-surface-0 hover:border-ink-300"
                    >
                      <Minus aria-hidden className="size-4" />
                    </button>
                    <span className="w-8 text-center font-bold tabular-nums" aria-live="polite">
                      {qty}
                    </span>
                    <button
                      type="button"
                      aria-label={`Tambah ${product.name} ${product.brandName}`}
                      disabled={tooExpensive}
                      onClick={() => onChange(product.id, qty + 1)}
                      className="flex size-10 items-center justify-center rounded-full bg-brand-red text-white hover:bg-brand-red-strong disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus aria-hidden className="size-4" />
                    </button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={tooExpensive}
                    aria-label={`Pilih ${product.name} ${product.brandName}`}
                    onClick={() => onChange(product.id, 1)}
                    className="shrink-0"
                  >
                    <Plus aria-hidden className="size-4" />
                    Pilih
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function SummaryCard({
  modal,
  summary,
}: {
  modal: number;
  summary: ReturnType<typeof summarize> | null;
}) {
  return (
    <section className={cn(cardClass, 'p-5')} aria-labelledby="ringkasan-judul" data-testid="ringkasan-cuan">
      <h2 id="ringkasan-judul" className="text-base font-bold">
        Ringkasan simulasi
      </h2>
      <dl className="mt-4 flex flex-col gap-3 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-ink-700">Modal awal</dt>
          <dd className="font-bold tabular-nums">{formatRupiah(modal)}</dd>
        </div>
        {summary ? (
          <>
            <div className="flex justify-between gap-3 border-t border-surface-100 pt-3">
              <dt className="text-ink-700">Modal terpakai</dt>
              <dd className="font-bold text-brand-red tabular-nums" data-testid="modal-terpakai">
                {formatRupiah(summary.capital)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-700">Sisa modal</dt>
              <dd className="font-bold tabular-nums" data-testid="sisa-modal">
                {formatRupiah(summary.remaining)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-700">Jumlah unit</dt>
              <dd className="font-bold tabular-nums">{summary.units.toLocaleString('id-ID')}</dd>
            </div>
          </>
        ) : null}
      </dl>
      {summary ? (
        <div className="mt-4 rounded-control bg-success-soft p-4">
          <p className="text-xs font-semibold text-success">Total keuntungan</p>
          <p className="mt-1 flex items-center gap-2 text-2xl font-extrabold text-success tabular-nums" data-testid="total-cuan">
            <TrendingUp aria-hidden className="size-5" />
            {formatRupiah(summary.profit)}
          </p>
          <p className="mt-1 text-sm font-semibold text-success">{percent(summary.profit, summary.capital)} dari modal terpakai</p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink-700">Hitung rekomendasi atau pilih produk untuk melihat keuntungan.</p>
      )}
      <p className="mt-4 text-xs text-ink-500">Perkiraan dari harga di daftar, bukan jaminan keuntungan.</p>
    </section>
  );
}

function ExportButton({
  lines,
  summary,
  modal,
}: {
  lines: Line[];
  summary: ReturnType<typeof summarize>;
  modal: number;
}) {
  const toast = useToast();
  async function download() {
    const header = [
      'Nama produk',
      'Kategori',
      'Brand',
      'Harga modal',
      'Harga jual',
      'Cashback',
      'Untung per unit',
      'Jumlah',
      'Subtotal modal',
      'Subtotal untung',
    ];
    const cell = (value: string | number) => {
      const text = String(value);
      return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const rows = lines.map(({ product, qty }) => [
      product.name,
      product.categoryName,
      product.brandName,
      product.capitalPrice,
      product.sellingPrice,
      product.cashback,
      cuanProfit(product),
      qty,
      product.capitalPrice * qty,
      cuanProfit(product) * qty,
    ]);
    rows.push([]);
    rows.push(['TOTAL', '', '', '', '', '', '', summary.units, summary.capital, summary.profit]);
    rows.push(['Modal awal', '', '', '', '', '', '', '', modal, '']);
    rows.push(['Sisa modal', '', '', '', '', '', '', '', summary.remaining, '']);
    const csv = '﻿' + [header, ...rows].map((row) => row.map(cell).join(',')).join('\r\n');
    try {
      await saveFile(`kalkulator-cuan-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8');
      toast.show({ tone: 'success', message: 'Hasil simulasi diunduh sebagai CSV. Buka dengan Excel.' });
    } catch (error) {
      const declined = (error as { code?: string } | null)?.code === 'declined';
      toast.show({
        tone: declined ? 'info' : 'danger',
        message: declined ? 'Unduhan dibatalkan.' : 'Berkas tidak bisa diunduh di tampilan ini.',
      });
    }
  }
  return (
    <Button variant="secondary" onClick={() => void download()} className="w-full">
      <Download aria-hidden className="size-4" />
      Unduh hasil (Excel/CSV)
    </Button>
  );
}

function ContactCard({ contact }: { contact: CuanContact }) {
  const href = contact.greeting
    ? `${contact.whatsappUrl}?text=${encodeURIComponent(contact.greeting)}`
    : contact.whatsappUrl;
  return (
    <section className={cn(cardClass, 'flex gap-3 p-5')} aria-labelledby="daftar-digiposaja">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
        <MessageCircle aria-hidden className="size-5" />
      </span>
      <div className="min-w-0">
        <h2 id="daftar-digiposaja" className="text-base font-bold">
          Daftar DigiposAja lewat admin
        </h2>
        <p className="mt-1 text-sm text-ink-700">Untuk pendaftaran DigiposAja, hubungi admin di WhatsApp.</p>
        <p className="mt-2 text-sm font-bold text-success">{contact.whatsappLabel}</p>
        <a href={href} target="_blank" rel="noreferrer" className={cn(buttonClass({ size: 'sm' }), 'mt-3')}>
          <MessageCircle aria-hidden className="size-4" />
          Hubungi admin
        </a>
      </div>
    </section>
  );
}
