import type { AppConfig } from '../config';

/**
 * Pengirim pesan WhatsApp lewat WAHA (https://waha.devlike.pro) milik operator.
 * Alamat dan kunci API hanya dari environment server; browser tidak pernah melihatnya.
 * Pesan error tidak memuat kunci, nomor tujuan, atau isi pesan.
 */
export interface WaSender {
  sendText(chatId: string, text: string): Promise<void>;
}

const SEND_TIMEOUT_MS = 8000;

export function createWahaSender(
  config: Pick<AppConfig, 'WAHA_BASE_URL' | 'WAHA_API_KEY' | 'WAHA_SESSION'>,
  fetchImpl: typeof fetch = fetch,
): WaSender | null {
  const { WAHA_BASE_URL: baseUrl, WAHA_API_KEY: apiKey, WAHA_SESSION: session } = config;
  if (!baseUrl || !apiKey) return null;
  const endpoint = new URL('/api/sendText', baseUrl).toString();
  return {
    async sendText(chatId, text) {
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({ session, chatId, text }),
        signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`WAHA menjawab status ${response.status}.`);
    },
  };
}

/** Nomor HP Indonesia (08..., +628..., 628...) menjadi chat ID WAHA, atau `null` bila bentuknya tidak sah. */
export function phoneToChatId(phone: string): string | null {
  const digits = phone.replace(/[\s.-]/g, '');
  const match = /^(?:\+?62|0)(8\d{7,12})$/.exec(digits);
  return match ? `62${match[1]}@c.us` : null;
}
