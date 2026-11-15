import { DataNotice, EmptyState, buttonClass, cn, containerClass, formatDate } from '@agrabudi/ui';
import Link from 'next/link';
import { categoryLabel, ProductTile } from '@/components/catalog';
import { PendingContent, SectionUnavailable } from '@/components/Notices';
import { load } from '@/data';
import { appUrls } from '@/lib/env';

const sectionHeading = 'text-2xl font-extrabold tablet:text-3xl';
const textLink = 'font-semibold underline decoration-brand-red decoration-2 underline-offset-4';

export default async function HomePage() {
  const [banners, products, programs, vacancies] = await Promise.all([
    load((adapter) => adapter.listBanners('home')),
    load((adapter) => adapter.listProducts()),
    load((adapter) => adapter.listPrograms()),
    load((adapter) => adapter.listVacancies()),
  ]);
  const heroBanner = banners.ok ? banners.data.find((banner) => banner.slot === 'hero') : undefined;
  const openVacancies = vacancies.ok
    ? vacancies.data.filter((vacancy) => vacancy.status === 'open')
    : [];

  return (
    <>
      <section className="on-dark bg-ink-900 text-white">
        <div
          className={cn(
            containerClass,
            'grid gap-10 py-12 tablet:py-16 desktop:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] desktop:items-end desktop:py-24',
          )}
        >
          <div>
            <span aria-hidden className="block h-1.5 w-16 bg-brand-red" />
            <h1 className="mt-6 text-4xl leading-tight font-extrabold tablet:text-5xl desktop:text-6xl desktop:leading-none">
              Distributor Telkomsel dan agen IndiHome.
            </h1>
            <p className="mt-5 max-w-xl text-base text-ink-300 tablet:text-lg">
              Produk Telkomsel untuk pelanggan, layanan IndiHome untuk rumah, dan pembelian paket
              untuk mitra outlet.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/produk" className={buttonClass()}>
                Lihat produk
              </Link>
              <Link href="/digipos" className={buttonClass({ variant: 'on-dark' })}>
                Daftar jadi mitra Digipos
              </Link>
            </div>
          </div>

          <div
            data-banner-slot="home/hero"
            className="flex aspect-[4/3] flex-col justify-end gap-2 rounded-panel border border-dashed border-ink-500 p-5"
          >
            {banners.ok ? (
              <>
                <div>
                  <DataNotice meta={banners.meta} />
                </div>
                <p className="font-display text-lg font-bold">
                  {heroBanner ? heroBanner.title : 'Belum ada banner terbit'}
                </p>
                <p className="text-sm text-ink-300">
                  Slot banner Home, bagian hero. Gambar banner diatur Administrator Web dan belum
                  tersedia.
                </p>
              </>
            ) : (
              <p className="text-sm text-ink-300">Banner tidak dapat dimuat. {banners.message}</p>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="unit-bisnis" className={cn(containerClass, 'py-12 tablet:py-16')}>
        <h2 id="unit-bisnis" className={sectionHeading}>
          Dua unit bisnis
        </h2>
        <div className="mt-8 grid border-y border-ink-300 tablet:grid-cols-2 tablet:divide-x tablet:divide-ink-300">
          <article className="border-b border-ink-300 py-8 tablet:border-b-0 tablet:pr-10">
            <h3 className="text-3xl font-extrabold tablet:text-4xl">Telkomsel</h3>
            <p className="mt-3 max-w-md text-ink-700">
              Katalog untuk pelanggan, dikelompokkan per jenis produk.
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-5">
              {Object.entries(categoryLabel).map(([id, label]) => (
                <li key={id}>
                  <Link
                    href={`/produk?kategori=${id}`}
                    className={cn('inline-flex min-h-11 items-center', textLink)}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </article>
          <article className="py-8 tablet:pl-10">
            <h3 className="text-3xl font-extrabold tablet:text-4xl">IndiHome</h3>
            <p className="mt-3 max-w-md text-ink-700">
              Paket internet rumah, syarat pemasangan, dan pendaftaran minat.
            </p>
            <Link
              href="/indihome"
              className={cn('mt-4 inline-flex min-h-11 items-center', textLink)}
            >
              Lihat layanan IndiHome
            </Link>
          </article>
        </div>
      </section>

      <section aria-labelledby="produk-pelanggan" className="bg-surface-50">
        <div className={cn(containerClass, 'py-12 tablet:py-16')}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="produk-pelanggan" className={sectionHeading}>
              Produk untuk pelanggan
            </h2>
            {products.ok ? <DataNotice meta={products.meta} /> : null}
          </div>
          <div className="mt-8">
            {!products.ok ? (
              <SectionUnavailable title="Produk tidak dapat dimuat" message={products.message} />
            ) : products.data.length === 0 ? (
              <EmptyState
                title="Belum ada produk terbit"
                description="Produk tampil setelah diterbitkan Admin katalog."
              />
            ) : (
              <ul className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
                {products.data.slice(0, 4).map((product) => (
                  <li key={product.id}>
                    <ProductTile product={product} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Link href="/produk" className={cn('mt-6 inline-flex min-h-11 items-center', textLink)}>
            Semua produk
          </Link>
        </div>
      </section>

      <section aria-labelledby="promo-program" className={cn(containerClass, 'py-12 tablet:py-16')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="promo-program" className={sectionHeading}>
            Promo & Program
          </h2>
          {programs.ok ? <DataNotice meta={programs.meta} /> : null}
        </div>
        <div className="mt-6">
          {!programs.ok ? (
            <SectionUnavailable
              title="Promo dan program tidak dapat dimuat"
              message={programs.message}
            />
          ) : programs.data.length === 0 ? (
            <EmptyState
              title="Belum ada promo atau program"
              description="Program tampil setelah diterbitkan Admin program."
            />
          ) : (
            <ul className="divide-y divide-surface-100 border-y border-surface-100">
              {programs.data.map((program) => (
                <li
                  key={program.id}
                  className="grid gap-1 py-5 tablet:grid-cols-[16rem_minmax(0,1fr)] tablet:gap-8"
                >
                  <p className="text-sm text-ink-700">
                    {formatDate(program.startsAt)} sampai {formatDate(program.endsAt)}
                  </p>
                  <div>
                    <h3 className="text-xl font-bold">
                      <Link href={`/promo/${program.slug}`} className="hover:underline">
                        {program.title}
                      </Link>
                    </h3>
                    <p className="mt-1 max-w-prose text-sm text-ink-700">{program.summary}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-labelledby="mitra-outlet" className="on-dark bg-ink-900 text-white">
        <div
          className={cn(
            containerClass,
            'grid gap-6 py-12 tablet:grid-cols-[minmax(0,1fr)_auto] tablet:items-center tablet:py-16',
          )}
        >
          <div>
            <h2 id="mitra-outlet" className={sectionHeading}>
              Punya outlet?
            </h2>
            <p className="mt-3 max-w-xl text-ink-300">
              Mitra outlet membeli paket, memantau pesanan, dan mengikuti program lewat aplikasi
              Outlet.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={appUrls.outlet} className={buttonClass()}>
              Buka aplikasi Outlet
            </a>
            <Link href="/digipos" className={buttonClass({ variant: 'on-dark' })}>
              Daftar Digipos
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="karir" className={cn(containerClass, 'py-12 tablet:py-16')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="karir" className={sectionHeading}>
            Lowongan yang dibuka
          </h2>
          {vacancies.ok ? <DataNotice meta={vacancies.meta} /> : null}
        </div>
        <div className="mt-6">
          {!vacancies.ok ? (
            <SectionUnavailable title="Lowongan tidak dapat dimuat" message={vacancies.message} />
          ) : openVacancies.length === 0 ? (
            <EmptyState
              title="Belum ada lowongan yang dibuka"
              description="Lowongan baru tampil di sini saat dibuka."
            />
          ) : (
            <ul className="divide-y divide-surface-100 border-y border-surface-100">
              {openVacancies.map((vacancy) => (
                <li key={vacancy.id}>
                  <Link
                    href={`/karir/${vacancy.slug}`}
                    className="flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-1 py-3 hover:bg-surface-50"
                  >
                    <span>
                      <span className="block text-lg font-bold">{vacancy.title}</span>
                      <span className="block text-sm text-ink-700">
                        {vacancy.unit}, {vacancy.location}
                      </span>
                    </span>
                    <span className="text-sm text-ink-700">
                      Ditutup {formatDate(vacancy.closesAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Link href="/karir" className={cn('mt-6 inline-flex min-h-11 items-center', textLink)}>
          Semua lowongan
        </Link>
      </section>

      <section aria-labelledby="kantor-kontak" className="bg-surface-50">
        <div className={cn(containerClass, 'grid gap-6 py-12 tablet:grid-cols-2 tablet:py-16')}>
          <div>
            <h2 id="kantor-kontak" className={sectionHeading}>
              Kantor dan kontak
            </h2>
            <ul className="mt-4 flex flex-wrap gap-x-6">
              <li>
                <Link
                  href="/tentang/kantor"
                  className={cn('inline-flex min-h-11 items-center', textLink)}
                >
                  Lokasi kantor
                </Link>
              </li>
              <li>
                <Link href="/kontak" className={cn('inline-flex min-h-11 items-center', textLink)}>
                  Hubungi Kami
                </Link>
              </li>
            </ul>
          </div>
          <PendingContent what="Alamat kantor, jam layanan, dan kontak resmi" />
        </div>
      </section>
    </>
  );
}
