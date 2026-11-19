import {
  companyProfileSections,
  contentStatusSchema,
  emptyCompanyProfile,
  emptyWaNotificationSettings,
  layoutSectionSchema,
  navItemSchema,
  pickCompanySection,
  siteAssetKindSchema,
  siteBannerInputSchema,
  type AuditEvent,
  type CompanyProfileSection,
  type PublicationRecord,
  type SiteAsset,
  type SiteBanner,
  type SitePage,
  type WaGatewayStatus,
} from '@agrabudi/contracts';
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { authenticateWebAdmin, type StaffPrincipal } from '../auth/principals';
import type { Db } from '../db/database';
import type { SitePublicationsTable } from '../db/types';
import { findDocument, getDocument, parseDocument, putDocument } from '../domain/content';
import { audit } from '../lib/audit';
import { HttpError, conflict, invalid, notFound } from '../lib/errors';
import { detectImage, safeDisplayName } from '../lib/file-type';
import { envelope, parse } from '../lib/http';
import { newId } from '../lib/ids';
import { logout, updateOwnProfile } from './staff-auth';

const idParams = z.object({ id: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/) });
const ASSET_MAX_BYTES = 5 * 1024 * 1024;

declare module 'fastify' {
  interface FastifyRequest {
    webAdmin?: StaffPrincipal;
  }
}

function principal(request: FastifyRequest): StaffPrincipal {
  if (!request.webAdmin) throw new Error('Hook autentikasi CMS belum berjalan.');
  return request.webAdmin;
}

async function publish(
  db: Db,
  actorId: string,
  objectType: SitePublicationsTable['objectType'],
  objectId: string,
  objectTitle: string,
  revision: number,
) {
  await db
    .insertInto('sitePublications')
    .values({
      id: newId(),
      objectType,
      objectId,
      objectTitle: objectTitle.slice(0, 160),
      revision,
      actorId,
    })
    .execute();
}

/**
 * CMS API Administrator Web (/web-admin/api/v1). Hanya sesi realm `web_admin`; cookie staff
 * diabaikan. Hanya konten institusional: tidak ada produk, harga, order, lamaran, atau fee
 * di sini (PRD 2.4, US-02).
 */
export const cmsRoutes: FastifyPluginAsync = async (app) => {
  const { db, storage, config, wa } = app.deps;
  const mediaPrefix = `${config.MEDIA_PUBLIC_BASE_URL.replace(/\/$/, '')}/`;

  app.addHook('preHandler', async (request) => {
    // Logout harus tetap bisa membersihkan cookie walau sesi sudah habis.
    if (request.routeOptions.url?.endsWith('/auth/logout')) return;
    request.webAdmin = await authenticateWebAdmin(request);
  });

  const record = (
    request: FastifyRequest,
    action: string,
    objectType: string,
    objectId: string | null,
    objectLabel: string,
  ) =>
    audit(db, {
      actor: principal(request).actor,
      action,
      objectType,
      objectId,
      objectLabel,
      requestId: request.id,
    });

  app.get('/auth/me', async (request) => principal(request).session);
  app.post('/auth/logout', async (request, reply) => logout(request, reply, 'web_admin'));
  app.patch('/auth/profile', async (request) =>
    updateOwnProfile(db, principal(request), request.body, request.id),
  );

  // ---------------------------------------------------------------- halaman
  app.get('/pages', async () => {
    const rows = await db
      .selectFrom('sitePages')
      .selectAll()
      .orderBy('site')
      .orderBy('slug')
      .execute();
    return envelope(
      rows.map((row): SitePage => ({
        id: row.id,
        site: row.site,
        slug: row.slug,
        title: row.title,
        status: row.status,
        updatedAt: row.updatedAt.toISOString(),
      })),
    );
  });

  app.patch('/pages/:id/status', async (request, reply) => {
    const { id } = parse(idParams, request.params);
    const { status } = parse(z.object({ status: contentStatusSchema }), request.body);
    const page = await db
      .selectFrom('sitePages')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    if (!page) throw notFound('Halaman tidak ditemukan.');
    const revision = status === 'published' ? page.revision + 1 : page.revision;
    await db.updateTable('sitePages').set({ status, revision }).where('id', '=', id).execute();
    if (status === 'published')
      await publish(db, principal(request).actor.id, 'page', id, page.title, revision);
    await record(request, `page.status.${status}`, 'site_page', id, page.title);
    return reply.code(204).send();
  });

  // ---------------------------------------------------------------- banner
  app.get('/banners', async () => {
    const rows = await db
      .selectFrom('siteBanners')
      .selectAll()
      .orderBy('site')
      .orderBy('page')
      .orderBy('startsAt', 'desc')
      .execute();
    return envelope(
      rows.map((row): SiteBanner => ({
        id: row.id,
        site: row.site,
        page: row.page,
        slot: row.slot,
        title: row.title,
        subtitle: row.subtitle,
        ctaLabel: row.ctaLabel,
        ctaHref: row.ctaHref,
        imageUrl: row.imageUrl,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
        status: row.status,
      })),
    );
  });

  /** Simpan banner (baru atau ubah). Gambar wajib aset yang diunggah ke media sendiri. */
  app.put('/banners/:id', async (request) => {
    const { id } = parse(idParams, request.params);
    const input = parse(siteBannerInputSchema, request.body);
    if (input.imageUrl !== null && !input.imageUrl.startsWith(mediaPrefix)) {
      throw invalid('Gambar banner harus diunggah lewat Aset Website.', {
        imageUrl: 'Unggah gambar lewat Aset Website.',
      });
    }
    const values = {
      site: input.site,
      page: input.page,
      slot: input.slot,
      title: input.title,
      subtitle: input.subtitle,
      ctaLabel: input.ctaLabel,
      ctaHref: input.ctaHref,
      imageUrl: input.imageUrl,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      status: input.status,
    };
    const existing = await db
      .selectFrom('siteBanners')
      .select(['revision'])
      .where('id', '=', id)
      .executeTakeFirst();
    const revision = (existing?.revision ?? 0) + (input.status === 'published' ? 1 : 0);
    if (existing) {
      await db
        .updateTable('siteBanners')
        .set({ ...values, revision })
        .where('id', '=', id)
        .execute();
    } else {
      await db
        .insertInto('siteBanners')
        .values({ id, ...values, revision })
        .execute();
    }
    if (input.status === 'published')
      await publish(db, principal(request).actor.id, 'banner', id, input.title, revision);
    await record(
      request,
      existing ? 'banner.update' : 'banner.create',
      'site_banner',
      id,
      input.title,
    );
    return { id };
  });

  app.delete('/banners/:id', async (request, reply) => {
    const { id } = parse(idParams, request.params);
    const banner = await db
      .selectFrom('siteBanners')
      .select('title')
      .where('id', '=', id)
      .executeTakeFirst();
    if (!banner) throw notFound('Banner tidak ditemukan.');
    await db.deleteFrom('siteBanners').where('id', '=', id).execute();
    await record(request, 'banner.delete', 'site_banner', id, banner.title);
    return reply.code(204).send();
  });

  app.get('/publications', async () => {
    const rows = await db
      .selectFrom('sitePublications')
      .selectAll()
      .orderBy('publishedAt', 'desc')
      .limit(200)
      .execute();
    return envelope(
      rows.map((row): PublicationRecord => ({
        id: row.id,
        objectType: row.objectType,
        objectTitle: row.objectTitle,
        revision: Math.max(1, row.revision),
        publishedAt: row.publishedAt.toISOString(),
      })),
    );
  });

  // ---------------------------------------------------------------- navigasi dan layout
  app.get('/navigation', async () => {
    const rows = await db
      .selectFrom('siteNavigation')
      .select(['id', 'site', 'label', 'href', 'visible', 'locked'])
      .orderBy('site')
      .orderBy('sortOrder')
      .execute();
    return envelope(rows);
  });

  app.put('/navigation', async (request) => {
    const items = parse(z.array(navItemSchema).max(100), request.body);
    const current = await db.selectFrom('siteNavigation').selectAll().execute();
    // Menu milik modul bisnis terkunci: tidak bisa disembunyikan atau dihapus dari console.
    for (const locked of current.filter((item) => item.locked)) {
      const next = items.find((item) => item.id === locked.id);
      if (!next || !next.visible || next.href !== locked.href) {
        throw conflict(
          `Menu "${locked.label}" milik modul bisnis dan tidak bisa disembunyikan atau diubah tautannya.`,
        );
      }
    }
    const lockedIds = new Set(current.filter((item) => item.locked).map((item) => item.id));
    await db.transaction().execute(async (trx) => {
      await trx.deleteFrom('siteNavigation').execute();
      if (items.length > 0) {
        await trx
          .insertInto('siteNavigation')
          .values(
            items.map((item, index) => ({
              ...item,
              locked: lockedIds.has(item.id),
              sortOrder: index,
            })),
          )
          .execute();
      }
    });
    await publish(
      db,
      principal(request).actor.id,
      'navigation',
      'navigation',
      'Navigasi website',
      1,
    );
    await record(
      request,
      'navigation.update',
      'site_navigation',
      null,
      `${items.length} item navigasi`,
    );
    return { saved: items.length };
  });

  app.get('/layouts', async () => {
    const rows = await db
      .selectFrom('siteLayouts')
      .select(['id', 'page', 'label', 'component', 'visible'])
      .orderBy('page')
      .orderBy('sortOrder')
      .execute();
    return envelope(rows);
  });

  app.put('/layouts', async (request) => {
    const items = parse(z.array(layoutSectionSchema).max(200), request.body);
    await db.transaction().execute(async (trx) => {
      await trx.deleteFrom('siteLayouts').execute();
      if (items.length > 0) {
        await trx
          .insertInto('siteLayouts')
          .values(items.map((item, index) => ({ ...item, sortOrder: index })))
          .execute();
      }
    });
    await publish(db, principal(request).actor.id, 'layout', 'layout', 'Layout halaman', 1);
    await record(request, 'layout.update', 'site_layout', null, `${items.length} bagian layout`);
    return { saved: items.length };
  });

  // ---------------------------------------------------------------- aset
  app.get('/assets', async () => {
    const rows = await db
      .selectFrom('siteAssets')
      .selectAll()
      .orderBy('uploadedAt', 'desc')
      .execute();
    return envelope(
      rows.map((row): SiteAsset => ({
        id: row.id,
        name: row.name,
        kind: row.kind,
        url: row.url,
        sizeKb: row.sizeKb,
        uploadedAt: row.uploadedAt.toISOString(),
      })),
    );
  });

  /** Unggah gambar raster (PNG, JPEG, WebP), maksimal 5 MB. SVG ditolak karena bisa membawa skrip. */
  app.post('/assets', async (request, reply) => {
    if (!request.isMultipart()) throw invalid('Aset harus dikirim sebagai form berkas.');
    const fields: Record<string, string> = {};
    let data: Buffer | null = null;
    let fileName = '';
    for await (const part of request.parts()) {
      if (part.type === 'file') {
        if (data) {
          part.file.resume();
          continue;
        }
        data = await part.toBuffer();
        fileName = safeDisplayName(part.filename);
      } else if (typeof part.value === 'string') {
        fields[part.fieldname] = part.value;
      }
    }
    const kind = parse(siteAssetKindSchema, fields.kind);
    if (!data || data.length === 0)
      throw invalid('Pilih berkas gambar.', { file: 'Pilih berkas gambar.' });
    if (data.length > ASSET_MAX_BYTES)
      throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Gambar paling besar 5 MB.');
    const image = detectImage(data);
    if (!image) throw new HttpError(415, 'UNSUPPORTED_FILE', 'Gambar harus PNG, JPEG, atau WebP.');
    const name = safeDisplayName(fields.name?.trim() || fileName);
    const key = await storage.put('public', image.ext, data);
    const asset: SiteAsset = {
      id: newId(),
      name,
      kind,
      url: storage.publicUrl(key),
      sizeKb: Math.ceil(data.length / 1024),
      uploadedAt: new Date().toISOString(),
    };
    try {
      await db
        .insertInto('siteAssets')
        .values({
          id: asset.id,
          name,
          kind,
          fileKey: key,
          url: asset.url,
          sizeKb: asset.sizeKb,
          uploadedBy: principal(request).actor.id,
        })
        .execute();
    } catch (error) {
      await storage.remove('public', key);
      throw error;
    }
    await record(request, 'asset.upload', 'site_asset', asset.id, name);
    return reply.code(201).send(asset);
  });

  app.delete('/assets/:id', async (request, reply) => {
    const { id } = parse(idParams, request.params);
    const asset = await db
      .selectFrom('siteAssets')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    if (!asset) throw notFound('Aset tidak ditemukan.');
    const used = await db
      .selectFrom('siteBanners')
      .select('title')
      .where('imageUrl', '=', asset.url)
      .executeTakeFirst();
    if (used)
      throw conflict(`Aset ini masih dipakai banner "${used.title}". Ganti gambar banner dulu.`);
    await db.deleteFrom('siteAssets').where('id', '=', id).execute();
    await storage.remove('public', asset.fileKey);
    await record(request, 'asset.delete', 'site_asset', id, asset.name);
    return reply.code(204).send();
  });

  // ---------------------------------------------------------------- audit
  app.get('/audit', async () => {
    const rows = await db
      .selectFrom('auditEvents')
      .selectAll()
      .where('realm', '=', 'web_admin')
      .orderBy('id', 'desc')
      .limit(200)
      .execute();
    return envelope(
      rows.map((row): AuditEvent => ({
        id: String(row.id),
        at: row.at.toISOString(),
        actor: row.actorLabel,
        action: row.action,
        object: row.objectLabel,
      })),
    );
  });

  // ---------------------------------------------------------------- profil perusahaan dan kontak Kalkulator Cuan
  for (const [path, key] of [
    ['/company-profile', 'company_profile'],
    ['/cuan-contact', 'cuan_contact'],
  ] as const) {
    app.get(path, async () => envelope(await getDocument(db, key)));
    app.put(path, async (request) => {
      const body = parseDocument(key, request.body);
      await putDocument(db, key, body, principal(request).actor.id);
      await record(request, `${key}.update`, 'site_document', key, key);
      return envelope(body);
    });
  }

  /**
   * Editor per bagian profil (Tentang Kami, Area, Kantor, Hubungi Kami). Simpan satu bagian
   * tidak menimpa bagian lain. Belum pernah diisi = `data: null`, bukan isi bawaan.
   */
  app.get('/company-profile/:section', async (request) => {
    const { section } = parse(sectionParams, request.params);
    const profile = await findDocument(db, 'company_profile');
    if (!profile) return envelope(null);
    return envelope(pickCompanySection(profile, section));
  });
  app.put('/company-profile/:section', async (request) => {
    const { section } = parse(sectionParams, request.params);
    const part = companyProfileSections[section].parse(request.body);
    if ('offices' in part) {
      for (const [index, office] of part.offices.entries()) {
        if (office.imageUrl !== null && !office.imageUrl.startsWith(mediaPrefix)) {
          throw invalid('Foto kantor harus diunggah lewat Aset Website.', {
            [`offices.${index}.imageUrl`]: 'Pilih foto dari Aset Website.',
          });
        }
      }
    }
    if ('areas' in part) {
      for (const [index, area] of part.areas.entries()) {
        if (area.imageUrl !== null && !area.imageUrl.startsWith(mediaPrefix)) {
          throw invalid('Foto wilayah harus diunggah lewat Aset Website.', {
            [`areas.${index}.imageUrl`]: 'Pilih foto dari Aset Website.',
          });
        }
      }
    }
    const next = await db.transaction().execute(async (trx) => {
      // Kunci baris supaya dua editor bagian berbeda tidak saling menimpa.
      const row = await trx
        .selectFrom('siteDocuments')
        .select('body')
        .where('key', '=', 'company_profile')
        .forUpdate()
        .executeTakeFirst();
      const current = row ? parseDocument('company_profile', row.body) : emptyCompanyProfile;
      const merged = parseDocument('company_profile', { ...current, ...part });
      await putDocument(trx, 'company_profile', merged, principal(request).actor.id);
      return merged;
    });
    await record(
      request,
      `company_profile.${section}.update`,
      'site_document',
      'company_profile',
      SECTION_LABEL[section],
    );
    return envelope(pickCompanySection(next, section));
  });

  // ---------------------------------------------------------------- teks halaman Daftar Digipos
  app.get('/digipos-info', async () => envelope(await findDocument(db, 'digipos_info')));
  app.put('/digipos-info', async (request) => {
    const body = parseDocument('digipos_info', request.body);
    await putDocument(db, 'digipos_info', body, principal(request).actor.id);
    await record(request, 'digipos_info.update', 'site_document', 'digipos_info', 'Daftar Digipos');
    return envelope(body);
  });

  // ---------------------------------------------------------------- WA Gateway (WAHA)
  const waStatus = async (): Promise<WaGatewayStatus> => ({
    configured: wa !== null,
    notifications: (await findDocument(db, 'wa_notifications')) ?? emptyWaNotificationSettings,
  });
  app.get('/wa-gateway', async () => envelope(await waStatus()));
  app.put('/wa-gateway', async (request) => {
    const body = parseDocument('wa_notifications', request.body);
    await putDocument(db, 'wa_notifications', body, principal(request).actor.id);
    await record(
      request,
      'wa_notifications.update',
      'site_document',
      'wa_notifications',
      'WA Gateway',
    );
    return envelope(await waStatus());
  });

  /** Kirim pesan uji ke grup yang sudah disimpan. Hasil gagal dilaporkan apa adanya. */
  app.post(
    '/wa-gateway/test',
    { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const { target } = parse(waTestSchema, request.body);
      if (!wa) throw conflict('WAHA belum dikonfigurasi di server. Hubungi pengelola teknis.');
      const settings = (await findDocument(db, 'wa_notifications')) ?? emptyWaNotificationSettings;
      const chatId = settings[target];
      if (!chatId) throw conflict('ID grup ini belum disimpan. Simpan pengaturan dulu.');
      try {
        await wa.sendText(
          chatId,
          'Pesan uji dari Portal Agrabudi. Notifikasi WhatsApp untuk grup ini aktif.',
        );
      } catch (error) {
        request.log.warn(
          { event: 'wa_test_failed', reason: error instanceof Error ? error.message : 'unknown' },
          'pesan uji WhatsApp gagal',
        );
        throw new HttpError(
          503,
          'SERVICE_UNAVAILABLE',
          'WAHA tidak dapat mengirim pesan. Periksa sesi WAHA lalu coba lagi.',
        );
      }
      await record(
        request,
        'wa_gateway.test',
        'site_document',
        'wa_notifications',
        WA_TARGET_LABEL[target],
      );
      return reply.code(204).send();
    },
  );
};

const sectionParams = z.object({ section: z.enum(['about', 'areas', 'offices', 'channels']) });

const SECTION_LABEL: Record<CompanyProfileSection, string> = {
  about: 'Tentang Kami',
  areas: 'Area Layanan',
  offices: 'Lokasi Kantor',
  channels: 'Hubungi Kami',
};

const waTestSchema = z.object({ target: z.enum(['orderGroup', 'careerGroup', 'digiposGroup']) });

const WA_TARGET_LABEL: Record<z.infer<typeof waTestSchema>['target'], string> = {
  orderGroup: 'Uji grup pesanan',
  careerGroup: 'Uji grup lamaran',
  digiposGroup: 'Uji grup Digipos',
};
