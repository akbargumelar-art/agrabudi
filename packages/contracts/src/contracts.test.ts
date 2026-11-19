import { describe, expect, it } from 'vitest';
import {
  appUrlsSchema,
  createOutletAccountSchema,
  createStaffAccountSchema,
  maskPhone,
  passwordChangeSchema,
  passwordResetConfirmSchema,
  companyProfileSections,
  customerProductSchema,
  dataMetaSchema,
  emptyCompanyProfile,
  outletOrderSchema,
  outletPackageSchema,
  pickCompanySection,
  staffProfileUpdateSchema,
  waNotificationSettingsSchema,
} from './index';

describe('kontrak data', () => {
  it('menolak harga pecahan dan negatif', () => {
    const base = {
      id: 'pkg-1',
      channel: 'outlet',
      name: 'Paket Contoh',
      description: '',
      contents: '',
      categoryId: 'cat-1',
      minQty: 1,
      maxQty: null,
      multipleOf: 1,
      thumbnailUrl: null,
    };
    expect(outletPackageSchema.safeParse({ ...base, unitPriceRupiah: 420000 }).success).toBe(true);
    expect(outletPackageSchema.safeParse({ ...base, unitPriceRupiah: 420000.5 }).success).toBe(
      false,
    );
    expect(outletPackageSchema.safeParse({ ...base, unitPriceRupiah: -1 }).success).toBe(false);
  });

  it('menolak kanal yang salah pada tiap katalog', () => {
    const product = {
      id: 'p-1',
      slug: 'produk-contoh',
      channel: 'outlet',
      name: 'Produk Contoh',
      category: 'perdana',
      summary: '',
      terms: [],
      priceRupiah: null,
      imageUrl: null,
      status: 'published',
    };
    expect(customerProductSchema.safeParse(product).success).toBe(false);
    expect(customerProductSchema.safeParse({ ...product, channel: 'customer' }).success).toBe(true);
  });

  it('memisahkan status order dan status pembayaran', () => {
    const order = {
      id: 'o-1',
      number: 'CONTOH-0001',
      createdAt: '2026-11-01T02:00:00Z',
      status: 'diajukan',
      paymentStatus: 'belum_ditagih',
      items: [
        {
          packageId: 'pkg-1',
          nameSnapshot: 'Paket Contoh',
          contentsSnapshot: '',
          unitPriceRupiah: 420000,
          qty: 2,
          lineTotalRupiah: 840000,
        },
      ],
      totalRupiah: 840000,
    };
    expect(outletOrderSchema.safeParse(order).success).toBe(true);
    expect(outletOrderSchema.safeParse({ ...order, status: 'dibayar' }).success).toBe(false);
  });

  it('mewajibkan sumber data dan URL aplikasi yang sah', () => {
    expect(dataMetaSchema.safeParse({ source: 'demo', asOf: '2026-11-01T00:00:00Z' }).success).toBe(
      false,
    );
    expect(
      appUrlsSchema.safeParse({
        public: 'bukan-url',
        outlet: 'http://a.test',
        portal: 'http://b.test',
      }).success,
    ).toBe(false);
  });

  it('profil perusahaan: satu jenis kanal sekali; editor bagian menolak kolom bagian lain', () => {
    const email = { kind: 'email', label: 'Email', value: 'a@contoh.test' };
    expect(companyProfileSections.channels.safeParse({ channels: [email] }).success).toBe(true);
    expect(companyProfileSections.channels.safeParse({ channels: [email, email] }).success).toBe(
      false,
    );
    expect(companyProfileSections.areas.safeParse({ areas: [], vision: 'x' }).success).toBe(false);
    const profile = {
      ...emptyCompanyProfile,
      vision: 'Visi',
      areas: [{ name: 'A', districts: [], latitude: null, longitude: null, imageUrl: null }],
    };
    expect(pickCompanySection(profile, 'areas')).toEqual({ areas: profile.areas });
    expect(pickCompanySection(profile, 'about')).toEqual({
      about: [],
      history: [],
      vision: 'Visi',
      missions: [],
    });
  });

  it('area layanan: koordinat berpasangan dan dalam rentang; dokumen lama tetap terbaca', () => {
    const area = (extra: Record<string, unknown>) =>
      companyProfileSections.areas.safeParse({ areas: [{ name: 'A', districts: [], ...extra }] });
    const legacy = area({});
    expect(legacy.success && legacy.data.areas[0]).toEqual({
      name: 'A',
      districts: [],
      latitude: null,
      longitude: null,
      imageUrl: null,
    });
    expect(area({ latitude: -6.732, longitude: 108.5523 }).success).toBe(true);
    expect(area({ latitude: -6.732, longitude: null }).success).toBe(false);
    expect(area({ latitude: 91, longitude: 108 }).success).toBe(false);
    expect(area({ latitude: -6, longitude: 181 }).success).toBe(false);
    expect(area({ latitude: Number.NaN, longitude: 108 }).success).toBe(false);
  });

  it('WA Gateway: hanya ID grup @g.us atau kosong', () => {
    const base = { orderCustomer: false, careerGroup: null, digiposGroup: null };
    const ok = (orderGroup: string | null) =>
      waNotificationSettingsSchema.safeParse({ ...base, orderGroup }).success;
    expect(ok(null)).toBe(true);
    expect(ok('120363000000000001@g.us')).toBe(true);
    expect(ok('6281234567890-1600000000@g.us')).toBe(true);
    expect(ok('6281234567890@c.us')).toBe(false);
    expect(ok('https://chat.whatsapp.com/abc')).toBe(false);
    expect(
      waNotificationSettingsSchema.safeParse({ ...base, orderGroup: null, x: 1 }).success,
    ).toBe(false);
  });

  it('profil: nama wajib, nomor HP tetap teks, username tidak ikut diubah', () => {
    const base = { displayName: 'Nama Contoh', email: null, phone: '081200000000' };
    expect(staffProfileUpdateSchema.safeParse(base).success).toBe(true);
    expect(staffProfileUpdateSchema.safeParse({ ...base, displayName: '   ' }).success).toBe(false);
    expect(staffProfileUpdateSchema.safeParse({ ...base, phone: '0812-abc' }).success).toBe(false);
    expect(staffProfileUpdateSchema.safeParse({ ...base, email: 'bukan-email' }).success).toBe(
      false,
    );
    const parsed = staffProfileUpdateSchema.parse({ ...base, username: 'ganti' });
    expect('username' in parsed).toBe(false);
  });
});

describe('kontrak akun dan kata sandi', () => {
  it('kata sandi baru minimal 6 karakter dan tidak sama dengan yang lama', () => {
    const ok = { currentPassword: 'lama-sekali-123', newPassword: 'baru-sekali-456' };
    expect(passwordChangeSchema.safeParse(ok).success).toBe(true);
    expect(passwordChangeSchema.safeParse({ ...ok, newPassword: '12345' }).success).toBe(false);
    expect(passwordChangeSchema.safeParse({ ...ok, newPassword: '123456' }).success).toBe(true);
    expect(
      passwordChangeSchema.safeParse({ ...ok, newPassword: ok.currentPassword }).success,
    ).toBe(false);
  });

  it('kode reset tepat 6 angka', () => {
    const base = { identifier: 'adminmobile', newPassword: 'baru-sekali-456' };
    expect(passwordResetConfirmSchema.safeParse({ ...base, code: '012345' }).success).toBe(true);
    expect(passwordResetConfirmSchema.safeParse({ ...base, code: '12345' }).success).toBe(false);
    expect(passwordResetConfirmSchema.safeParse({ ...base, code: '12a456' }).success).toBe(false);
  });

  it('akun baru wajib nomor WhatsApp; tidak ada kolom kata sandi; Manager/Admin Web ditolak', () => {
    const base = {
      username: 'SF.Baru',
      displayName: 'Nama',
      phone: '081234567890',
      role: 'salesforce',
      unit: 'mobile',
      permissions: [],
    };
    const parsed = createStaffAccountSchema.parse({ ...base, password: 'diabaikan' });
    expect(parsed.username).toBe('sf.baru');
    expect('password' in parsed).toBe(false);
    expect(createStaffAccountSchema.safeParse({ ...base, phone: '' }).success).toBe(false);
    expect(createStaffAccountSchema.safeParse({ ...base, role: 'manager' }).success).toBe(false);
    expect(createStaffAccountSchema.safeParse({ ...base, role: 'web_admin' }).success).toBe(false);
    expect(
      createStaffAccountSchema.safeParse({ ...base, permissions: ['user.manage'] }).success,
    ).toBe(false);
  });

  it('ID Digipos akun outlet tetap teks dengan nol di depan', () => {
    const parsed = createOutletAccountSchema.parse({
      digiposId: ' 0012345 ',
      outletName: 'Outlet',
      ownerName: 'Pemilik',
      tap: null,
      phone: '081234567890',
      registeredAt: '2026-11-01',
    });
    expect(parsed.digiposId).toBe('0012345');
  });

  it('nomor HP disamarkan untuk ditampilkan', () => {
    expect(maskPhone('081234567890')).toBe('0812****7890');
    expect(maskPhone('+6281234567890')).toBe('6281****7890');
    expect(maskPhone('123')).toBe('****');
  });
});
