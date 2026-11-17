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

const personNameSchema = z
  .string()
  .trim()
  .min(1, 'Nama wajib diisi.')
  .max(80, 'Nama terlalu panjang.');
const addressSchema = z
  .string()
  .trim()
  .min(5, 'Alamat terlalu pendek.')
  .max(300, 'Alamat terlalu panjang.');

export const contactTopicSchema = z.enum(['produk', 'indihome', 'mitra', 'lainnya']);

/** Isian tiap form publik. Nama kolom sama dengan atribut `name` pada form di website Publik. */
export const contactFormSchema = z.object({
  name: personNameSchema,
  phone: phoneIdSchema,
  topic: contactTopicSchema,
  message: z.string().trim().min(10, 'Pesan minimal 10 karakter.').max(1000),
});
export type ContactForm = z.infer<typeof contactFormSchema>;

export const indihomeInterestFormSchema = z.object({
  name: personNameSchema,
  phone: phoneIdSchema,
  address: addressSchema,
});
export type IndihomeInterestForm = z.infer<typeof indihomeInterestFormSchema>;

export const digiposRegistrationFormSchema = z.object({
  outletName: z.string().trim().min(1, 'Nama outlet wajib diisi.').max(80),
  name: personNameSchema,
  phone: phoneIdSchema,
  address: addressSchema,
});
export type DigiposRegistrationForm = z.infer<typeof digiposRegistrationFormSchema>;

/** Lamaran: isian teks. Berkas CV dikirim sebagai bagian multipart `cv`. */
export const jobApplicationFormSchema = z.object({
  name: personNameSchema,
  email: z.email('Format email belum benar.').max(120),
  phone: phoneIdSchema,
  consent: z.literal('on', 'Persetujuan pemrosesan data wajib dicentang.'),
});
export type JobApplicationForm = z.infer<typeof jobApplicationFormSchema>;

/** Tanda terima dari server. Nomor referensi dibuat server, bukan browser (US-09). */
export const formReceiptSchema = z.object({
  reference: z.string().min(1),
  receivedAt: z.iso.datetime(),
});
export type FormReceipt = z.infer<typeof formReceiptSchema>;

/** Status tindak lanjut kiriman form di Portal. */
export const submissionStatusSchema = z.enum(['baru', 'dihubungi', 'selesai', 'ditolak']);
export type SubmissionStatus = z.infer<typeof submissionStatusSchema>;
