import {
  customerProductSchema,
  indihomePackageSchema,
  programSchema,
  siteBannerSchema,
  vacancySchema,
  type CustomerProduct,
  type DataEnvelope,
  type IndihomePackage,
  type Program,
  type SiteBanner,
  type Vacancy,
} from '@agrabudi/contracts';
import type { PublicDataAdapter } from '../adapter';

/**
 * DATA CONTOH untuk kerangka website Publik. Nama produk, harga, program,
 * lowongan, dan banner di bawah rekaan. Bukan data resmi dan tidak boleh
 * dipakai sebagai seed produksi (PRD 1.5, 3.3).
 */
const products: CustomerProduct[] = [
  {
    id: 'produk-contoh-1',
    slug: 'perdana-contoh-1',
    channel: 'customer',
    name: 'Perdana Contoh 1',
    category: 'perdana',
    summary: 'Ringkasan contoh untuk kartu perdana.',
    terms: ['Ketentuan contoh pertama.', 'Ketentuan contoh kedua.'],
    priceRupiah: 10000,
    imageUrl: null,
    status: 'published',
  },
  {
    id: 'produk-contoh-2',
    slug: 'perdana-contoh-2',
    channel: 'customer',
    name: 'Perdana Contoh 2',
    category: 'perdana',
    summary: 'Contoh produk yang harganya belum diterbitkan.',
    terms: ['Ketentuan contoh.'],
    priceRupiah: null,
    imageUrl: null,
    status: 'published',
  },
  {
    id: 'produk-contoh-3',
    slug: 'voucher-contoh-1',
    channel: 'customer',
    name: 'Voucher Contoh 1',
    category: 'voucher',
    summary: 'Ringkasan contoh untuk voucher.',
    terms: ['Ketentuan contoh.'],
    priceRupiah: 20000,
    imageUrl: null,
    status: 'published',
  },
  {
    id: 'produk-contoh-4',
    slug: 'orbit-contoh-1',
    channel: 'customer',
    name: 'Orbit Contoh 1',
    category: 'orbit',
    summary: 'Ringkasan contoh untuk Orbit.',
    terms: ['Ketentuan contoh.'],
    priceRupiah: null,
    imageUrl: null,
    status: 'published',
  },
  {
    id: 'produk-contoh-5',
    slug: 'soundbox-contoh-1',
    channel: 'customer',
    name: 'Soundbox Contoh 1',
    category: 'soundbox',
    summary: 'Ringkasan contoh untuk Soundbox.',
    terms: ['Ketentuan contoh.'],
    priceRupiah: 150000,
    imageUrl: null,
    status: 'published',
  },
].map((product) => customerProductSchema.parse(product));

const programs: Program[] = [
  {
    id: 'program-publik-contoh-1',
    slug: 'promo-contoh-1',
    audience: 'public',
    title: 'Promo Contoh 1',
    summary: 'Ringkasan contoh. Syarat dan periode resmi diisi Admin program.',
    terms: ['Syarat contoh pertama.', 'Syarat contoh kedua.'],
    startsAt: '2026-11-01',
    endsAt: '2026-11-30',
    status: 'published',
  },
  {
    id: 'program-publik-contoh-2',
    slug: 'program-contoh-2',
    audience: 'public',
    title: 'Program Contoh 2',
    summary: 'Ringkasan contoh kedua.',
    terms: ['Syarat contoh.'],
    startsAt: '2026-12-01',
    endsAt: '2026-12-31',
    status: 'published',
  },
].map((program) => programSchema.parse(program));

const vacancies: Vacancy[] = [
  {
    id: 'lowongan-contoh-1',
    slug: 'posisi-contoh-1',
    title: 'Posisi Contoh 1',
    unit: 'Unit contoh',
    location: 'Lokasi contoh',
    summary: 'Ringkasan contoh tentang pekerjaan ini.',
    requirements: ['Persyaratan contoh pertama.', 'Persyaratan contoh kedua.'],
    closesAt: '2026-12-15',
    status: 'open',
  },
  {
    id: 'lowongan-contoh-2',
    slug: 'posisi-contoh-2',
    title: 'Posisi Contoh 2',
    unit: 'Unit contoh',
    location: 'Lokasi contoh',
    summary: 'Ringkasan contoh kedua.',
    requirements: ['Persyaratan contoh.'],
    closesAt: '2026-12-31',
    status: 'open',
  },
  {
    id: 'lowongan-contoh-3',
    slug: 'posisi-contoh-3',
    title: 'Posisi Contoh 3',
    unit: 'Unit contoh',
    location: 'Lokasi contoh',
    summary: 'Contoh lowongan yang sudah ditutup.',
    requirements: ['Persyaratan contoh.'],
    closesAt: '2026-10-31',
    status: 'closed',
  },
].map((vacancy) => vacancySchema.parse(vacancy));

const indihomePackages: IndihomePackage[] = [
  {
    id: 'indihome-contoh-1',
    name: 'Paket IndiHome Contoh 1',
    summary: 'Ringkasan contoh. Kecepatan dan isi paket resmi diisi Admin unit IndiHome.',
    monthlyPriceRupiah: null,
  },
  {
    id: 'indihome-contoh-2',
    name: 'Paket IndiHome Contoh 2',
    summary: 'Ringkasan contoh kedua.',
    monthlyPriceRupiah: 300000,
  },
].map((item) => indihomePackageSchema.parse(item));

const banners: SiteBanner[] = [
  {
    id: 'banner-contoh-1',
    site: 'public',
    page: 'home',
    slot: 'hero',
    title: 'Banner contoh hero',
    imageUrl: null,
    startsAt: '2026-11-01',
    endsAt: '2026-11-30',
    status: 'published',
  },
].map((banner) => siteBannerSchema.parse(banner));

function asMock<T>(data: T): DataEnvelope<T> {
  return {
    data,
    meta: {
      source: 'mock',
      asOf: new Date().toISOString(),
      note: 'Data contoh untuk kerangka website Publik. Bukan data resmi.',
    },
  };
}

export const mockAdapter: PublicDataAdapter = {
  listProducts: async () => asMock(products),
  getProduct: async (slug) => asMock(products.find((product) => product.slug === slug) ?? null),
  listPrograms: async () => asMock(programs),
  getProgram: async (slug) => asMock(programs.find((program) => program.slug === slug) ?? null),
  listVacancies: async () => asMock(vacancies),
  getVacancy: async (slug) => asMock(vacancies.find((vacancy) => vacancy.slug === slug) ?? null),
  listIndihomePackages: async () => asMock(indihomePackages),
  listBanners: async (page) => asMock(banners.filter((banner) => banner.page === page)),
};
