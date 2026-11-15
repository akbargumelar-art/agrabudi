/** Rupiah tanpa desimal, contoh: Rp1.565.000. Masukan harus integer rupiah. */
export function formatRupiah(amount: number): string {
  if (!Number.isFinite(amount)) return 'Rp-';
  return `Rp${Math.trunc(amount).toLocaleString('id-ID')}`;
}

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
});

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Jakarta',
});

/** Tanggal ditampilkan dalam WIB (PRD 4.5). */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '-' : dateFormatter.format(date);
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '-' : `${dateTimeFormatter.format(date)} WIB`;
}
