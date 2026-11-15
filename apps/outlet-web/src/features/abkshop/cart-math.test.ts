import type { OutletPackage } from '@agrabudi/contracts';
import { describe, expect, it } from 'vitest';
import { checkQty, stepQty, summarizeCart } from './cart-math';

function pkg(
  overrides: Partial<OutletPackage> & Pick<OutletPackage, 'id' | 'unitPriceRupiah'>,
): OutletPackage {
  return {
    channel: 'outlet',
    name: `Paket ${overrides.id}`,
    description: '',
    contents: '',
    categoryId: 'k1',
    minQty: 1,
    maxQty: null,
    multipleOf: 1,
    thumbnailUrl: null,
    ...overrides,
  };
}

const a = pkg({ id: 'a', unitPriceRupiah: 420000 });
const b = pkg({ id: 'b', unitPriceRupiah: 725000 });
const c = pkg({ id: 'c', unitPriceRupiah: 150000, minQty: 2, multipleOf: 2, maxQty: 10 });

describe('summarizeCart', () => {
  it('fixture PRD US-05: 2 x Rp420.000 + 1 x Rp725.000 = Rp1.565.000', () => {
    const summary = summarizeCart([a, b, c], { a: '2', b: '1' });
    expect(summary.subtotalRupiah).toBe(1565000);
    expect(summary.distinctCount).toBe(2);
    expect(summary.totalQty).toBe(3);
    expect(summary.canCheckout).toBe(true);
  });

  it('keranjang kosong tidak bisa checkout', () => {
    expect(summarizeCart([a, b], {}).canCheckout).toBe(false);
    expect(summarizeCart([a, b], { a: '0', b: '' }).canCheckout).toBe(false);
  });

  it('satu input tidak valid memblokir checkout dan tidak ikut dijumlahkan', () => {
    const summary = summarizeCart([a, b], { a: '2', b: '-1' });
    expect(summary.invalidIds).toEqual(['b']);
    expect(summary.subtotalRupiah).toBe(840000);
    expect(summary.canCheckout).toBe(false);
  });

  it('total tidak pernah NaN atau negatif untuk masukan sembarang', () => {
    for (const raw of ['abc', '1.5', '1,5', '-3', ' ', '1e3', '9'.repeat(30), '٣']) {
      const summary = summarizeCart([a], { a: raw });
      expect(Number.isNaN(summary.subtotalRupiah)).toBe(false);
      expect(summary.subtotalRupiah).toBeGreaterThanOrEqual(0);
      expect(summary.totalQty).toBeGreaterThanOrEqual(0);
    }
  });

  it('mengabaikan id yang tidak ada di katalog', () => {
    expect(summarizeCart([a], { hantu: '5' }).subtotalRupiah).toBe(0);
  });
});

describe('checkQty', () => {
  it('menerapkan minimum, maksimum, dan kelipatan dari aturan paket', () => {
    expect(checkQty('1', c)).toMatchObject({ valid: false });
    expect(checkQty('3', c)).toMatchObject({ valid: false });
    expect(checkQty('12', c)).toMatchObject({ valid: false });
    expect(checkQty('4', c)).toEqual({ valid: true, qty: 4 });
  });

  it('menerima nol dan kosong sebagai tidak dipilih', () => {
    expect(checkQty('0', c)).toEqual({ valid: true, qty: 0 });
    expect(checkQty(undefined, c)).toEqual({ valid: true, qty: 0 });
  });
});

describe('stepQty', () => {
  it('naik dari kosong ke minimum lalu per kelipatan, berhenti di maksimum', () => {
    expect(stepQty('', c, 1)).toBe('2');
    expect(stepQty('2', c, 1)).toBe('4');
    expect(stepQty('10', c, 1)).toBe('10');
  });

  it('turun di bawah minimum mengosongkan pilihan', () => {
    expect(stepQty('4', c, -1)).toBe('2');
    expect(stepQty('2', c, -1)).toBe('');
    expect(stepQty('', c, -1)).toBe('');
  });
});
