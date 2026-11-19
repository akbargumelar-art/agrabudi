import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config';
import { createWahaSender, phoneToChatId } from '../src/lib/waha';

const base = {
  DB_HOST: 'localhost',
  DB_USER: 'u',
  DB_NAME: 'd',
  DB_TLS: 'off',
  APP_URL_PUBLIC: 'https://a.test',
  APP_URL_OUTLET: 'https://b.test',
  APP_URL_PORTAL: 'https://c.test',
  STORAGE_DIR: '/tmp/x',
  MEDIA_PUBLIC_BASE_URL: 'https://a.test/media',
};

describe('konfigurasi WAHA', () => {
  it('alamat dan kunci wajib berpasangan; alamat hanya origin; tanpa isian = notifikasi mati', () => {
    expect(() => loadConfig({ ...base, WAHA_BASE_URL: 'https://waha.test' })).toThrow(
      /WAHA_BASE_URL/,
    );
    expect(() =>
      loadConfig({ ...base, WAHA_BASE_URL: 'https://waha.test/api', WAHA_API_KEY: 'k' }),
    ).toThrow(/origin WAHA/);
    expect(() =>
      loadConfig({ ...base, WAHA_BASE_URL: 'https://u:p@waha.test', WAHA_API_KEY: 'k' }),
    ).toThrow(/origin WAHA/);
    const ok = loadConfig({ ...base, WAHA_BASE_URL: 'https://waha.test', WAHA_API_KEY: 'k' });
    expect(ok.WAHA_SESSION).toBe('default');
    expect(createWahaSender(loadConfig(base))).toBeNull();
    // Baris kosong dari env file (api.env.example) sama dengan tidak diisi.
    expect(
      createWahaSender(loadConfig({ ...base, WAHA_BASE_URL: '', WAHA_API_KEY: '' })),
    ).toBeNull();
  });

  it('pesan error konfigurasi tidak memuat nilai kunci', () => {
    try {
      loadConfig({ ...base, WAHA_API_KEY: 'kunci-rahasia-uji' });
      expect.unreachable();
    } catch (error) {
      expect(String(error)).not.toContain('kunci-rahasia-uji');
    }
  });
});

describe('pengirim WAHA', () => {
  it('memanggil /api/sendText dengan X-Api-Key; status gagal dilempar tanpa kunci', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    let status = 201;
    const fetchStub = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response('{}', { status });
    }) as unknown as typeof fetch;
    const sender = createWahaSender(
      { WAHA_BASE_URL: 'https://waha.test', WAHA_API_KEY: 'kunci-rahasia', WAHA_SESSION: 'abk' },
      fetchStub,
    );
    if (!sender) throw new Error('pengirim seharusnya aktif');
    await sender.sendText('120363000000000001@g.us', 'Halo');
    expect(calls[0]?.url).toBe('https://waha.test/api/sendText');
    expect((calls[0]?.init.headers as Record<string, string>)['x-api-key']).toBe('kunci-rahasia');
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({
      session: 'abk',
      chatId: '120363000000000001@g.us',
      text: 'Halo',
    });
    status = 401;
    await expect(sender.sendText('x@g.us', 'Halo')).rejects.toThrow(/^WAHA menjawab status 401\.$/);
  });

  it('nomor HP Indonesia menjadi chat ID; bentuk lain ditolak', () => {
    expect(phoneToChatId('081234567890')).toBe('6281234567890@c.us');
    expect(phoneToChatId('+62 812-3456-7890')).toBe('6281234567890@c.us');
    expect(phoneToChatId('6281234567890')).toBe('6281234567890@c.us');
    expect(phoneToChatId('')).toBeNull();
    expect(phoneToChatId('0231123456')).toBeNull();
  });
});
