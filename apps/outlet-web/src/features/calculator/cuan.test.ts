import { cuanProfit } from '@agrabudi/contracts';
import { describe, expect, it } from 'vitest';
import { mockCuanProducts } from '@agrabudi/ui/mock-cuan';
import { recommend, summarize } from './CalculatorPage';

const none = { categories: new Set<string>(), brands: new Set<string>(), hotOnly: false };

describe('Kalkulator Cuan', () => {
  it('untung per unit = jual - modal + cashback', () => {
    expect(cuanProfit({ capitalPrice: 80000, sellingPrice: 120000, cashback: 7000 })).toBe(47000);
  });

  it('rekomendasi tidak pernah melebihi modal dan mendahulukan rasio untung tertinggi', () => {
    for (const modal of [5000, 37500, 100000, 1_000_000]) {
      const lines = recommend(mockCuanProducts, modal, none);
      const summary = summarize(lines, modal);
      expect(summary.capital).toBeLessThanOrEqual(modal);
      expect(summary.remaining).toBeGreaterThanOrEqual(0);
      const ratios = lines.map((line) => cuanProfit(line.product) / line.product.capitalPrice);
      expect([...ratios].sort((a, b) => b - a)).toEqual(ratios);
    }
  });

  it('filter brand, kategori, dan unggulan dihormati', () => {
    const lines = recommend(mockCuanProducts, 500000, {
      categories: new Set(['pulsa']),
      brands: new Set(['byu']),
      hotOnly: false,
    });
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.every((line) => line.product.brandId === 'byu' && line.product.categoryId === 'pulsa')).toBe(true);
    const hot = recommend(mockCuanProducts, 500000, { ...none, hotOnly: true });
    expect(hot.every((line) => line.product.isHot)).toBe(true);
  });

  it('modal yang terlalu kecil menghasilkan rekomendasi kosong', () => {
    expect(recommend(mockCuanProducts, 1000, none)).toEqual([]);
  });

  it('produk tanpa harga modal tidak ikut rekomendasi', () => {
    const lines = recommend(mockCuanProducts, 1_000_000, none);
    expect(lines.some((line) => line.product.capitalPrice === 0)).toBe(false);
  });
});
