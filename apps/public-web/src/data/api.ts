import {
  companyProfileSchema,
  customerProductSchema,
  digiposInfoSchema,
  envelopeSchema,
  indihomeInfoSchema,
  indihomePackageSchema,
  programSchema,
  siteBannerSchema,
  vacancySchema,
} from '@agrabudi/contracts';
import { ApiRequestError, apiRequest } from '@agrabudi/contracts/http';
import { connection } from 'next/server';
import { z } from 'zod';
import { DataUnavailableError, type PublicDataAdapter } from './adapter';

/**
 * Adapter HTTP ke API publik (/api/public/v1), dipanggil dari server Next.js lewat alamat
 * internal (API_INTERNAL_URL), bukan dari browser. `no-store` membuat halaman selalu
 * membaca konten terbit terbaru dan build tidak bergantung pada API yang hidup.
 */
function baseUrl(): string {
  const value = process.env.API_INTERNAL_URL;
  if (!value) {
    throw new DataUnavailableError('Layanan data website belum dikonfigurasi di server ini.');
  }
  return `${value.replace(/\/$/, '')}/api/public/v1`;
}

async function read<S extends z.ZodType>(path: string, schema: S): Promise<z.infer<S>> {
  // Halaman yang membaca API selalu dirender saat diminta, tidak pernah dibekukan saat build.
  await connection();
  try {
    return await apiRequest(`${baseUrl()}${path}`, schema, { cache: 'no-store' });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      // 404 pada dokumen tunggal = belum diterbitkan; lainnya = gangguan. Keduanya jujur ditampilkan.
      throw new DataUnavailableError(
        error.status === 404
          ? error.message
          : 'Layanan data website sedang terganggu. Coba lagi beberapa saat.',
      );
    }
    throw error;
  }
}

const list = <S extends z.ZodType>(item: S) => envelopeSchema(z.array(item));
const one = <S extends z.ZodType>(item: S) => envelopeSchema(item.nullable());
const slug = (value: string) => encodeURIComponent(value);

export const apiAdapter: PublicDataAdapter = {
  listProducts: () => read('/customer-products', list(customerProductSchema)),
  getProduct: (value) => read(`/customer-products/${slug(value)}`, one(customerProductSchema)),
  listPrograms: () => read('/programs', list(programSchema)),
  getProgram: (value) => read(`/programs/${slug(value)}`, one(programSchema)),
  listVacancies: () => read('/vacancies', list(vacancySchema)),
  getVacancy: (value) => read(`/vacancies/${slug(value)}`, one(vacancySchema)),
  listIndihomePackages: () => read('/indihome-packages', list(indihomePackageSchema)),
  listBanners: (page) => read(`/banners?page=${encodeURIComponent(page)}`, list(siteBannerSchema)),
  getCompanyProfile: () => read('/company-profile', envelopeSchema(companyProfileSchema)),
  getIndihomeInfo: () => read('/indihome-info', envelopeSchema(indihomeInfoSchema)),
  getDigiposInfo: () => read('/digipos-info', envelopeSchema(digiposInfoSchema)),
};
