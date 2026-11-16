import type { CustomerCategory, CustomerProduct } from '@agrabudi/contracts';
import { MediaPlaceholder, cardClass, cn, formatRupiah, type IconComponent } from '@agrabudi/ui';
import { CardSim, Router, Speaker, Ticket } from 'lucide-react';
import Link from 'next/link';

export const categoryLabel: Record<CustomerCategory, string> = {
  perdana: 'Perdana',
  voucher: 'Voucher',
  orbit: 'Orbit',
  soundbox: 'Soundbox',
};

export const categoryIcon: Record<CustomerCategory, IconComponent> = {
  perdana: CardSim,
  voucher: Ticket,
  orbit: Router,
  soundbox: Speaker,
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

/** Gambar produk, atau tempat gambar berlabel bila belum diunggah. */
export function ProductImage({
  product,
  className,
}: {
  product: CustomerProduct;
  className?: string;
}) {
  if (product.imageUrl) {
    return (
      <img
        src={product.imageUrl}
        alt={`Gambar ${product.name}`}
        loading="lazy"
        className={cn('object-cover', className)}
      />
    );
  }
  return (
    <MediaPlaceholder
      label={`Foto ${product.name} belum tersedia`}
      icon={categoryIcon[product.category]}
      tone={product.category === 'perdana' || product.category === 'voucher' ? 'red' : 'ink'}
      className={className}
    />
  );
}

/** Kartu produk katalog pelanggan. Seluruh kartu adalah tautan ke detail. */
export function ProductCard({ product }: { product: CustomerProduct }) {
  return (
    <Link
      href={`/produk/${product.slug}`}
      className={cn(cardClass, 'flex h-full flex-col overflow-hidden hover:border-ink-300')}
    >
      <ProductImage product={product} className="aspect-4/3 w-full" />
      <span className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="self-start rounded-full bg-surface-50 px-2.5 py-0.5 text-xs font-medium text-ink-700">
          {categoryLabel[product.category]}
        </span>
        <span className="font-display text-lg font-bold">{product.name}</span>
        <span className="text-sm text-ink-700">{product.summary}</span>
        <span className="mt-auto pt-3">
          <ProductPrice priceRupiah={product.priceRupiah} />
        </span>
      </span>
    </Link>
  );
}
