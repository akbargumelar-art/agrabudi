import type { CustomerCategory, CustomerProduct } from '@agrabudi/contracts';
import { formatRupiah } from '@agrabudi/ui';
import Link from 'next/link';

export const categoryLabel: Record<CustomerCategory, string> = {
  perdana: 'Perdana',
  voucher: 'Voucher',
  orbit: 'Orbit',
  soundbox: 'Soundbox',
};

export function ProductPrice({ priceRupiah }: { priceRupiah: number | null }) {
  return priceRupiah === null ? (
    <span className="text-sm text-ink-700">Harga belum diterbitkan</span>
  ) : (
    <span className="font-display text-lg font-bold text-brand-red-strong">
      {formatRupiah(priceRupiah)}
    </span>
  );
}

/** Satu produk di daftar katalog pelanggan. Seluruh petak adalah tautan ke detail. */
export function ProductTile({ product }: { product: CustomerProduct }) {
  return (
    <Link
      href={`/produk/${product.slug}`}
      className="flex h-full flex-col gap-2 border-t-2 border-ink-900 bg-surface-0 p-4 hover:border-brand-red"
    >
      <span className="text-xs font-medium text-ink-700">{categoryLabel[product.category]}</span>
      <span className="font-display text-lg font-bold">{product.name}</span>
      <span className="text-sm text-ink-700">{product.summary}</span>
      <span className="mt-auto pt-2">
        <ProductPrice priceRupiah={product.priceRupiah} />
      </span>
    </Link>
  );
}
