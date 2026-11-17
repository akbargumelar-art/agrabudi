import type { Cell } from '@agrabudi/contracts';
import { invalid } from '../lib/errors';

/**
 * Membaca isian sel dari form Portal dengan aturan per kolom. Semua kesalahan dikumpulkan
 * lalu dijawab sekaligus (422) dengan pesan per kolom, supaya form bisa menandai semuanya.
 */
export class CellReader {
  private readonly errors: Record<string, string> = {};

  constructor(private readonly cells: Record<string, Cell>) {}

  private raw(key: string): string {
    const value = this.cells[key];
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  private fail(key: string, message: string) {
    this.errors[key] ??= message;
  }

  text(key: string, max: number): string {
    const value = this.raw(key);
    if (!value) this.fail(key, 'Wajib diisi.');
    else if (value.length > max) this.fail(key, `Paling banyak ${max} karakter.`);
    return value;
  }

  optionalText(key: string, max: number): string | null {
    const value = this.raw(key);
    if (value.length > max) this.fail(key, `Paling banyak ${max} karakter.`);
    return value || null;
  }

  /** Teks berbaris menjadi daftar, mis. syarat atau isi paket. */
  lines(key: string, maxItems = 30, maxLength = 300): string[] {
    const items = this.raw(key)
      .split(/\r?\n/)
      .map((line) => line.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean);
    if (items.length > maxItems) this.fail(key, `Paling banyak ${maxItems} baris.`);
    if (items.some((item) => item.length > maxLength))
      this.fail(key, `Satu baris paling banyak ${maxLength} karakter.`);
    return items;
  }

  /** Bilangan bulat nonnegatif. Uang tidak pernah pecahan (PRD 4.5). */
  int(key: string, options: { min?: number; max?: number } = {}): number {
    const value = this.optionalInt(key, options);
    if (value === null) {
      this.fail(key, 'Wajib diisi.');
      return 0;
    }
    return value;
  }

  optionalInt(
    key: string,
    { min = 0, max = 2_000_000_000 }: { min?: number; max?: number } = {},
  ): number | null {
    const value = this.raw(key);
    if (!value) return null;
    if (!/^\d+$/.test(value)) {
      this.fail(key, 'Isi angka bulat tanpa titik atau koma.');
      return null;
    }
    const number = Number(value);
    if (number < min) this.fail(key, `Minimal ${min}.`);
    if (number > max) this.fail(key, `Maksimal ${max}.`);
    return number;
  }

  date(key: string): string {
    const value = this.raw(key);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
      this.fail(key, 'Isi tanggal yang sah.');
    }
    return value;
  }

  /** Pilihan berlabel Indonesia ke nilai enum. */
  option<T extends string>(key: string, labels: Readonly<Record<T, string>>): T {
    const value = this.raw(key);
    const found = (Object.entries(labels) as Array<[T, string]>).find(
      ([, label]) => label === value,
    );
    if (!found) {
      this.fail(key, `Pilih salah satu: ${Object.values(labels).join(', ')}.`);
      return Object.keys(labels)[0] as T;
    }
    return found[0];
  }

  addError(key: string, message: string) {
    this.fail(key, message);
  }

  /** Lempar 422 bila ada kesalahan. Dipanggil sebelum menulis ke database. */
  done() {
    if (Object.keys(this.errors).length > 0)
      throw invalid('Ada isian yang belum sesuai.', this.errors);
  }
}

export function labelOf<T extends string>(labels: Readonly<Record<T, string>>, value: T): string {
  return labels[value];
}
