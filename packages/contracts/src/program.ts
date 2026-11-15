import { z } from 'zod';
import { contentStatusSchema } from './meta';

export const programAudienceSchema = z.enum(['public', 'outlet', 'internal']);
export type ProgramAudience = z.infer<typeof programAudienceSchema>;

/** Promo & Program. Syarat dan periode milik Admin program, bukan Administrator Web (PRD 2.4). */
export const programSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  audience: programAudienceSchema,
  title: z.string().min(1),
  summary: z.string(),
  terms: z.array(z.string()),
  startsAt: z.iso.date(),
  endsAt: z.iso.date(),
  status: contentStatusSchema,
});
export type Program = z.infer<typeof programSchema>;
