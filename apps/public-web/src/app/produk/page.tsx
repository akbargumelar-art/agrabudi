import { customerCategorySchema } from '@agrabudi/contracts';
import { DataNotice, EmptyState, cn } from '@agrabudi/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { categoryLabel, ProductTile } from '@/components/catalog';
import { SectionUnavailable } from '@/components/Notices';
import { PageIntro, pageBodyClass } from '@/components/PageIntro';
import { load } from '@/data';

export const metadata: Metadata = { title: 'Produk' };

type ProductsPageProps = { searchParams: Promise<{ kategori?: string | string[] }> };

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { kategori } = await searchParams;
  // Nilai kategori dari URL divalidasi; nilai lain dianggap "semua".
  const parsed = customerCategorySchema.safeParse(Array.isArray(kategori) ? kategori[0] : kategori);
  const active = parsed.success ? parsed.data : null;
  const products = await load((adapter) => adapter.listProducts());
  const visible = products.ok
    ? products.data.filter((product) => active === null || product.category === active)
    : [];

  const filters = [
    { href: '/produk', label: 'Semua', current: active === null },
    ...customerCategorySchema.options.map((id) => ({
      href: `/produk?kategori=${id}`,
      label: categoryLabel[id],
      current: active === id,
    })),
  ];

  return (
    <>
      <PageIntro
        title="Produk"
        description="ABKShop Pelanggan: perdana, voucher, Orbit, dan Soundbox."
        aside={products.ok ? <DataNotice meta={products.meta} /> : null}
      />
      <div className={pageBodyClass}>
        <nav aria-label="Kategori produk">
          <ul className="flex gap-2 overflow-x-auto">
            {filters.map((filter) => (
              <li key={filter.href} className="shrink-0">
                <Link
                  href={filter.href}
                  aria-current={filter.current ? 'page' : undefined}
                  className={cn(
                    'inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium',
                    filter.current
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : 'border-ink-300 text-ink-700 hover:border-ink-900',
                  )}
                >
                  {filter.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {!products.ok ? (
          <SectionUnavailable title="Produk tidak dapat dimuat" message={products.message} />
        ) : visible.length === 0 ? (
          <EmptyState
            title={active ? `Belum ada produk ${categoryLabel[active]}` : 'Belum ada produk terbit'}
            description="Produk tampil setelah diterbitkan Admin katalog pelanggan."
          />
        ) : (
          <ul className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
            {visible.map((product) => (
              <li key={product.id}>
                <ProductTile product={product} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
