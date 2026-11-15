import {
  Carousel,
  DataNotice,
  EmptyState,
  IconBadge,
  SectionHeading,
  SignalRings,
  buttonClass,
  cardClass,
  cn,
  containerClass,
  moreLinkClass,
  type IconComponent,
} from '@agrabudi/ui';
import {
  ChevronRight,
  Map,
  MapPin,
  Megaphone,
  MessageCircle,
  ReceiptText,
  ShoppingCart,
  Wifi,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { categoryIcon, categoryLabel, ProductCard } from '@/components/catalog';
import { ProgramCard, VacancyList } from '@/components/listings';
import { SectionUnavailable } from '@/components/Notices';
import { load } from '@/data';
import { appUrls } from '@/lib/env';

const sectionClass = cn(containerClass, 'py-10 tablet:py-14');

function HeroSlide({ tone, children }: { tone: 'red' | 'navy'; children: ReactNode }) {
  return (
    <div
      className={cn(
        'on-dark relative flex min-h-96 items-end overflow-hidden rounded-banner p-6 text-white tablet:min-h-112 tablet:items-center tablet:p-14',
        tone === 'red' ? 'bg-brand-red' : 'bg-ink-900',
      )}
    >
      <SignalRings className="pointer-events-none absolute -right-10 -bottom-10 size-80 text-white opacity-20 tablet:size-136" />
      <div className="relative max-w-2xl pb-14 tablet:pb-0">{children}</div>
    </div>
  );
}

const services: Array<{ href: string; label: string; icon: IconComponent }> = [
  ...(Object.keys(categoryLabel) as Array<keyof typeof categoryLabel>).map((id) => ({
    href: `/produk?kategori=${id}`,
    label: categoryLabel[id],
    icon: categoryIcon[id],
  })),
  { href: '/indihome', label: 'IndiHome', icon: Wifi },
];

const outletBenefits: Array<{ icon: IconComponent; title: string; note: string }> = [
  {
    icon: ShoppingCart,
    title: 'Beli paket lewat tabel pemesanan',
    note: 'Isi jumlah per paket, lihat total, lalu checkout.',
  },
  {
    icon: ReceiptText,
    title: 'Pantau status pesanan',
    note: 'Status order dan status pembayaran ditampilkan terpisah.',
  },
  {
    icon: Megaphone,
    title: 'Ikuti promo dan program mitra',
    note: 'Periode dan syarat program dalam satu tempat.',
  },
];

const helpLinks: Array<{ href: string; icon: IconComponent; title: string; note: string }> = [
  {
    href: '/kontak',
    icon: MessageCircle,
    title: 'Hubungi Kami',
    note: 'Kanal resmi untuk pertanyaan pelanggan dan mitra.',
  },
  {
    href: '/tentang/kantor',
    icon: MapPin,
    title: 'Lokasi kantor',
    note: 'Alamat, jam layanan, dan peta kantor.',
  },
  {
    href: '/tentang/area',
    icon: Map,
    title: 'Area layanan',
    note: 'Wilayah yang dilayani Agrabudi Komunika.',
  },
];

function MoreLink({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} className={moreLinkClass}>
      {children}
      <ChevronRight aria-hidden className="size-4" />
    </Link>
  );
}

export default async function HomePage() {
  const [banners, products, programs, vacancies] = await Promise.all([
    load((adapter) => adapter.listBanners('home')),
    load((adapter) => adapter.listProducts()),
    load((adapter) => adapter.listPrograms()),
    load((adapter) => adapter.listVacancies()),
  ]);
  const heroBanners = banners.ok ? banners.data.filter((banner) => banner.slot === 'hero') : [];
  const openVacancies = vacancies.ok
    ? vacancies.data.filter((vacancy) => vacancy.status === 'open')
    : [];

  const heroSlides = [
    {
      key: 'utama',
      content: (
        <HeroSlide tone="red">
          <h1 className="text-4xl leading-tight font-extrabold tablet:text-5xl desktop:text-6xl">
            Distributor Telkomsel dan agen IndiHome.
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/90 tablet:text-lg">
            Produk Telkomsel untuk pelanggan, layanan IndiHome untuk rumah, dan pembelian paket
            untuk mitra outlet.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/produk" className={buttonClass({ variant: 'inverse' })}>
              Lihat produk
            </Link>
            <Link href="/digipos" className={buttonClass({ variant: 'on-dark' })}>
              Daftar jadi mitra Digipos
            </Link>
          </div>
        </HeroSlide>
      ),
    },
    ...heroBanners.map((banner) => ({
      key: banner.id,
      content: (
        <HeroSlide tone="navy">
          {banners.ok ? <DataNotice meta={banners.meta} /> : null}
          <p className="mt-4 font-display text-3xl leading-tight font-extrabold tablet:text-5xl">
            {banner.title}
          </p>
          <p className="mt-4 max-w-xl text-base text-white/80">
            Slot banner Home. Gambar dan tautan banner diatur Administrator Web; gambarnya belum
            tersedia.
          </p>
        </HeroSlide>
      ),
    })),
  ];

  return (
    <>
      <section aria-label="Sorotan" className={cn(containerClass, 'pt-4 tablet:pt-6')}>
        <Carousel
          label="Banner utama"
          items={heroSlides}
          itemClassName="w-full"
          controls="overlay"
          onColor
        />
        {!banners.ok ? (
          <p className="mt-2 text-sm text-ink-700">Banner tidak dapat dimuat. {banners.message}</p>
        ) : null}
      </section>

      <section aria-labelledby="pilih-layanan" className={sectionClass}>
        <SectionHeading id="pilih-layanan" title="Pilih layanan sesuai kebutuhan" />
        <ul className="mt-6 grid grid-cols-2 gap-3 tablet:grid-cols-5 tablet:gap-4">
          {services.map((service) => (
            <li key={service.href} className="last:col-span-2 tablet:last:col-span-1">
              <Link
                href={service.href}
                className={cn(
                  cardClass,
                  'flex min-h-20 items-center gap-3 p-4 font-semibold hover:border-brand-red',
                )}
              >
                <IconBadge icon={service.icon} />
                {service.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="mitra-outlet" className="bg-surface-50">
        <div
          className={cn(
            sectionClass,
            'grid gap-8 desktop:grid-cols-2 desktop:items-center desktop:gap-16',
          )}
        >
          <div>
            <SectionHeading
              id="mitra-outlet"
              title="Untuk mitra outlet"
              description="Outlet yang sudah terverifikasi berbelanja dan memantau pesanan lewat aplikasi Outlet."
            />
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={appUrls.outlet} className={buttonClass()}>
                Buka aplikasi Outlet
              </a>
              <Link href="/digipos" className={buttonClass({ variant: 'secondary' })}>
                Daftar Digipos
              </Link>
            </div>
          </div>
          <ul className={cn(cardClass, 'divide-y divide-surface-100')}>
            {outletBenefits.map((benefit) => (
              <li key={benefit.title} className="flex items-center gap-4 p-5">
                <IconBadge icon={benefit.icon} tone="navy" />
                <span>
                  <span className="block font-semibold">{benefit.title}</span>
                  <span className="block text-sm text-ink-700">{benefit.note}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="produk-pelanggan" className={sectionClass}>
        <SectionHeading
          id="produk-pelanggan"
          title="Produk untuk pelanggan"
          aside={
            <>
              {products.ok ? <DataNotice meta={products.meta} /> : null}
              <MoreLink href="/produk">Semua produk</MoreLink>
            </>
          }
        />
        <div className="mt-6">
          {!products.ok ? (
            <SectionUnavailable title="Produk tidak dapat dimuat" message={products.message} />
          ) : products.data.length === 0 ? (
            <EmptyState
              title="Belum ada produk terbit"
              description="Produk tampil setelah diterbitkan Admin katalog."
            />
          ) : (
            <Carousel
              label="Produk untuk pelanggan"
              itemClassName="w-64 tablet:w-72"
              items={products.data.map((product) => ({
                key: product.id,
                content: <ProductCard product={product} />,
              }))}
            />
          )}
        </div>
      </section>

      <section aria-labelledby="promo-program" className={cn(sectionClass, 'pt-0 tablet:pt-0')}>
        <SectionHeading
          id="promo-program"
          title="Promo & Program"
          aside={
            <>
              {programs.ok ? <DataNotice meta={programs.meta} /> : null}
              <MoreLink href="/promo">Semua promo</MoreLink>
            </>
          }
        />
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
            <ul className="grid gap-4 tablet:grid-cols-2">
              {programs.data.slice(0, 2).map((program, index) => (
                <li key={program.id}>
                  <ProgramCard program={program} tone={index % 2 === 0 ? 'red' : 'navy'} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-labelledby="bantuan" className="bg-surface-50">
        <div className={sectionClass}>
          <SectionHeading id="bantuan" title="Butuh bantuan?" />
          <ul className="mt-6 grid gap-4 tablet:grid-cols-3">
            {helpLinks.map((help) => (
              <li key={help.href}>
                <Link
                  href={help.href}
                  className={cn(
                    cardClass,
                    'flex h-full items-center gap-4 p-5 hover:border-brand-red',
                  )}
                >
                  <IconBadge icon={help.icon} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{help.title}</span>
                    <span className="block text-sm text-ink-700">{help.note}</span>
                  </span>
                  <ChevronRight aria-hidden className="size-5 shrink-0 text-ink-500" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="karir" className={sectionClass}>
        <SectionHeading
          id="karir"
          title="Lowongan yang dibuka"
          aside={
            <>
              {vacancies.ok ? <DataNotice meta={vacancies.meta} /> : null}
              <MoreLink href="/karir">Semua lowongan</MoreLink>
            </>
          }
        />
        <div className="mt-6">
          {!vacancies.ok ? (
            <SectionUnavailable title="Lowongan tidak dapat dimuat" message={vacancies.message} />
          ) : openVacancies.length === 0 ? (
            <EmptyState
              title="Belum ada lowongan yang dibuka"
              description="Lowongan baru tampil di sini saat dibuka."
            />
          ) : (
            <VacancyList vacancies={openVacancies} />
          )}
        </div>
      </section>
    </>
  );
}
