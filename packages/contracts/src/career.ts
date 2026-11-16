import { z } from 'zod';

export const vacancyStatusSchema = z.enum(['open', 'closed']);
export type VacancyStatus = z.infer<typeof vacancyStatusSchema>;

/** Lowongan milik Admin dengan izin rekrutmen (PRD 2.4). */
export const vacancySchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  unit: z.string(),
  location: z.string(),
  summary: z.string(),
  requirements: z.array(z.string()),
  /** Jenis kerja, mis. "Penuh waktu" atau "Kontrak". */
  employmentType: z.string(),
  closesAt: z.iso.date(),
  status: vacancyStatusSchema,
});
export type Vacancy = z.infer<typeof vacancySchema>;
