import { z } from 'zod';

/**
 * Produk Kalkulator Cuan (mengikuti modul cuan di repo landing). Harga dalam rupiah
 * bulat. Keuntungan per unit = harga jual - harga modal + cashback.
 */
export const cuanProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  categoryId: z.string(),
  categoryName: z.string(),
  brandId: z.string(),
  brandName: z.string(),
  capitalPrice: z.number().int().nonnegative(),
  sellingPrice: z.number().int().nonnegative(),
  cashback: z.number().int().nonnegative(),
  isHot: z.boolean(),
});
export type CuanProduct = z.infer<typeof cuanProductSchema>;

/** Kontak pendaftaran DigiposAja yang tampil di Kalkulator Cuan, diatur Admin Web. */
export const cuanContactSchema = z.object({
  whatsappLabel: z.string(),
  whatsappUrl: z.string().url(),
  greeting: z.string(),
});
export type CuanContact = z.infer<typeof cuanContactSchema>;

export const cuanProfit = (product: Pick<CuanProduct, 'capitalPrice' | 'sellingPrice' | 'cashback'>) =>
  product.sellingPrice - product.capitalPrice + product.cashback;
