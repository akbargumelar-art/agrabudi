import { DataNotice, buttonClass } from '@agrabudi/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { categoryLabel, ProductPrice } from '@/components/catalog';
import { SectionUnavailable } from '@/components/Notices';
import { PageIntro, pageBodyClass } from '@/components/PageIntro';
import { load } from '@/data';

export const metadata: Metadata = { title: 'Detail produk' };

type ProductPageProps = { params: Promise<{ slug: string }> };

const back = (
  <Link href="/produk" className="font-medium text-info underline">
    Semua produk
  </Link>
);

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await load((adapter) => adapter.getProduct(slug));

  if (!product.ok) {
    return (
      <>
        <PageIntro title="Detail produk" back={back} />
        <div className={pageBodyClass}>
          <SectionUnavailable title="Produk tidak dapat dimuat" message={product.message} />
        </div>
      </>
    );
  }
  if (!product.data) notFound();
  const detail = product.data;

  return (
    <>
      <PageIntro
        title={detail.name}
        description={detail.summary}
        back={back}
        aside={<DataNotice meta={product.meta} />}
      />
      <div className={pageBodyClass}>
        <div className="grid gap-10 desktop:grid-cols-[minmax(0,1fr)_22rem] desktop:items-start">
          <section aria-labelledby="ketentuan">
            <p className="text-sm text-ink-700">Kategori: {categoryLabel[detail.category]}</p>
            <h2 id="ketentuan" className="mt-6 text-xl font-bold">
              Ketentuan
            </h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-ink-900">
              {detail.terms.map((term) => (
                <li key={term}>{term}</li>
              ))}
            </ul>
          </section>
          <aside
            aria-label="Harga dan cara membeli"
            className="rounded-panel border border-surface-100 p-5"
          >
            <p className="text-sm text-ink-700">Harga</p>
            <p className="mt-1">
              <ProductPrice priceRupiah={detail.priceRupiah} />
            </p>
            <p className="mt-4 text-sm text-ink-700">
              Pembelian lewat website belum tersedia untuk pelanggan. Untuk membeli, hubungi kami.
            </p>
            <Link
              href="/kontak"
              className={`mt-4 ${buttonClass({ variant: 'secondary', block: true })}`}
            >
              Hubungi Kami
            </Link>
          </aside>
        </div>
      </div>
    </>
  );
}
