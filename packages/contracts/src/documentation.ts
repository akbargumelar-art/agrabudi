import { z } from 'zod';

/**
 * Dokumentasi penyerahan hadiah program ke outlet pemenang, untuk slider di Outlet.
 * Hanya memuat data yang layak tampil ke sesama mitra. Koordinat lokasi, nama petugas,
 * dan catatan internal sengaja tidak ada di kontrak tampilan ini.
 */
export const rewardHandoverSchema = z.object({
  id: z.string().min(1),
  programTitle: z.string().min(1),
  rewardName: z.string().min(1),
  outletName: z.string().min(1),
  /** Kode atau nama TAP outlet, bila ada. */
  tap: z.string().nullable(),
  receiverName: z.string().nullable(),
  handedOverAt: z.iso.date(),
  /** `null` berarti foto belum diunggah. */
  photoUrl: z.string().nullable(),
});
export type RewardHandover = z.infer<typeof rewardHandoverSchema>;
