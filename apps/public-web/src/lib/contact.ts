import type { CompanyProfile } from '@agrabudi/contracts';

/**
 * Kanal resmi yang disahkan pemilik (18 Nov 2026). Dipakai footer di semua halaman;
 * halaman Hubungi Kami tetap membaca profil perusahaan dari CMS.
 */
export const officialChannels: CompanyProfile['channels'] = [
  { kind: 'whatsapp', label: 'WhatsApp', value: '+62 851-6882-2280' },
  { kind: 'instagram', label: 'Instagram', value: '@agrabudikomunika' },
  { kind: 'website', label: 'Website', value: 'www.agrabudikomunika.com' },
  { kind: 'facebook', label: 'Facebook', value: 'tsel.id/fbciraya' },
];
