import type { OutletPackage } from '@agrabudi/contracts';

/**
 * Hitungan keranjang di sisi browser. Ini hanya estimasi untuk UX:
 * harga, diskon, dan batas jumlah yang mengikat dihitung ulang server
 * saat quote dibuat (PRD 2.7, AS-12).
 */

export type QtyCheck = { valid: true; qty: number } | { valid: false; qty: 0; message: string };

function invalid(message: string): QtyCheck {
  return { valid: false, qty: 0, message };
}

/** Kosong atau nol berarti tidak dipilih. Selain itu harus bilangan bulat yang memenuhi aturan paket. */
export function checkQty(raw: string | undefined, pkg: OutletPackage): QtyCheck {
  const text = (raw ?? '').trim();
  if (text === '') return { valid: true, qty: 0 };
  if (!/^\d+$/.test(text))
    return invalid('Isi dengan bilangan bulat, tanpa koma atau tanda minus.');
  const qty = Number(text);
  if (!Number.isSafeInteger(qty)) return invalid('Jumlah terlalu besar.');
  if (qty === 0) return { valid: true, qty: 0 };
  if (qty < pkg.minQty) return invalid(`Minimal ${pkg.minQty}.`);
  if (pkg.maxQty !== null && qty > pkg.maxQty) return invalid(`Maksimal ${pkg.maxQty}.`);
  if (qty % pkg.multipleOf !== 0) return invalid(`Harus kelipatan ${pkg.multipleOf}.`);
  return { valid: true, qty };
}

export type CartLine = { pkg: OutletPackage; qty: number; lineTotalRupiah: number };

export type CartSummary = {
  lines: CartLine[];
  distinctCount: number;
  totalQty: number;
  subtotalRupiah: number;
  invalidIds: string[];
  canCheckout: boolean;
};

/**
 * Ringkasan dihitung dari SEMUA paket, bukan dari baris yang sedang tampil,
 * supaya filter dan pencarian tidak mengubah total (PRD 2.7 butir 3).
 */
export function summarizeCart(
  packages: OutletPackage[],
  quantities: Readonly<Record<string, string>>,
): CartSummary {
  const lines: CartLine[] = [];
  const invalidIds: string[] = [];
  for (const pkg of packages) {
    const check = checkQty(quantities[pkg.id], pkg);
    if (!check.valid) {
      invalidIds.push(pkg.id);
      continue;
    }
    if (check.qty > 0) {
      lines.push({ pkg, qty: check.qty, lineTotalRupiah: check.qty * pkg.unitPriceRupiah });
    }
  }
  const totalQty = lines.reduce((sum, line) => sum + line.qty, 0);
  const subtotalRupiah = lines.reduce((sum, line) => sum + line.lineTotalRupiah, 0);
  return {
    lines,
    distinctCount: lines.length,
    totalQty,
    subtotalRupiah,
    invalidIds,
    canCheckout: lines.length > 0 && invalidIds.length === 0,
  };
}

/** Nilai berikutnya untuk tombol tambah/kurang, mengikuti minimum dan kelipatan paket. */
export function stepQty(raw: string | undefined, pkg: OutletPackage, direction: 1 | -1): string {
  const parsed = Number.parseInt((raw ?? '').trim(), 10);
  const current = Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 0;
  if (direction === 1) {
    if (current < pkg.minQty)
      return String(Math.ceil(pkg.minQty / pkg.multipleOf) * pkg.multipleOf);
    const next = (Math.floor(current / pkg.multipleOf) + 1) * pkg.multipleOf;
    return String(pkg.maxQty !== null ? Math.min(next, pkg.maxQty) : next);
  }
  const previous = (Math.ceil(current / pkg.multipleOf) - 1) * pkg.multipleOf;
  return previous < pkg.minQty ? '' : String(previous);
}
