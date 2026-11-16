import { z } from 'zod';

/** Form publik yang mengirim data ke petugas (PRD 2.6, US-08, US-09). */
export const publicFormKindSchema = z.enum([
  'contact',
  'indihome_interest',
  'digipos_registration',
  'job_application',
]);
export type PublicFormKind = z.infer<typeof publicFormKindSchema>;

/** Nomor HP Indonesia sebagai teks: nol di depan tidak boleh hilang. */
export const phoneIdSchema = z
  .string()
  .trim()
  .regex(/^(\+62|0)8\d{7,12}$/, 'Nomor HP diawali 08 atau +628, 10 sampai 15 digit.');

/** Batas berkas CV. Nilai final ditentukan perusahaan (PRD US-08). */
export const CV_MAX_BYTES = 2 * 1024 * 1024;
export const CV_ACCEPT = '.pdf,.doc,.docx';
