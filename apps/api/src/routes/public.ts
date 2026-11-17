import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  getCustomerProduct,
  getDocument,
  getProgram,
  getVacancy,
  listActiveBanners,
  listCustomerProducts,
  listIndihomePackages,
  listPrograms,
  listVacancies,
} from '../domain/content';
import { envelope, parse } from '../lib/http';

const slugParams = z.object({ slug: z.string().min(1).max(120) });
const bannerQuery = z.object({ page: z.string().regex(/^[a-z0-9-]{1,60}$/) });

/**
 * API website Publik (/api/public/v1). Hanya baca konten terbit untuk audiens publik:
 * katalog pelanggan (bukan katalog Outlet), program publik, lowongan, paket IndiHome,
 * banner, dan profil perusahaan (PRD 4.3, 4.6). Detail yang tidak ada = `data: null`.
 */
export const publicRoutes: FastifyPluginAsync = async (app) => {
  const { db } = app.deps;

  // Konten publik boleh di-cache sebentar oleh proxy; data pribadi tidak lewat route ini.
  app.addHook('onSend', async (_request, reply, payload) => {
    if (reply.statusCode === 200) reply.header('cache-control', 'public, max-age=60');
    return payload;
  });

  app.get('/customer-products', async () => envelope(await listCustomerProducts(db)));
  app.get('/customer-products/:slug', async (request) => {
    const { slug } = parse(slugParams, request.params);
    return envelope(await getCustomerProduct(db, slug));
  });

  app.get('/programs', async () => envelope(await listPrograms(db, 'public')));
  app.get('/programs/:slug', async (request) => {
    const { slug } = parse(slugParams, request.params);
    return envelope(await getProgram(db, 'public', slug));
  });

  app.get('/vacancies', async () => envelope(await listVacancies(db)));
  app.get('/vacancies/:slug', async (request) => {
    const { slug } = parse(slugParams, request.params);
    return envelope(await getVacancy(db, slug));
  });

  app.get('/indihome-packages', async () => envelope(await listIndihomePackages(db)));

  app.get('/banners', async (request) => {
    const { page } = parse(bannerQuery, request.query);
    return envelope(await listActiveBanners(db, page));
  });

  app.get('/company-profile', async () => envelope(await getDocument(db, 'company_profile')));
  app.get('/indihome-info', async () => envelope(await getDocument(db, 'indihome_info')));
  app.get('/digipos-info', async () => envelope(await getDocument(db, 'digipos_info')));
};
