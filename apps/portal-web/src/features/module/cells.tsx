import { StatusBadge, cn, formatDate, formatRupiah, type StatusTone } from '@agrabudi/ui';
import type { Cell, Column } from '../../data/types';

const toneByWord: Record<string, StatusTone> = {
  Aktif: 'success',
  Tercapai: 'success',
  Selesai: 'success',
  Lunas: 'success',
  Final: 'success',
  Terbit: 'success',
  Berhasil: 'success',
  PS: 'success',
  Disetujui: 'success',
  Diterima: 'success',
  Hadir: 'success',
  Terverifikasi: 'success',
  Berlaku: 'success',
  Dibuka: 'success',
  'Jadi order': 'success',
  Terjual: 'success',
  'Belum tercapai': 'warning',
  Diproses: 'warning',
  Draft: 'warning',
  'Menunggu verifikasi': 'warning',
  Terlambat: 'warning',
  'Sebagian ditolak': 'warning',
  'Seleksi berkas': 'warning',
  Wawancara: 'warning',
  Verifikasi: 'warning',
  Survei: 'warning',
  Dihubungi: 'warning',
  RE: 'warning',
  Terjadwal: 'warning',
  Penjajakan: 'warning',
  Berjalan: 'warning',
  'Belum bayar': 'warning',
  Izin: 'warning',
  'Tidak aktif': 'danger',
  Ditolak: 'danger',
  Batal: 'danger',
  Nonaktif: 'danger',
  'Tidak tercakup': 'danger',
  Baru: 'info',
  IO: 'info',
  Teralokasi: 'info',
  Ditutup: 'neutral',
  'Belum aktif': 'neutral',
  'Belum diatur': 'neutral',
  Diarsipkan: 'neutral',
};

export function cellText(column: Column, value: Cell): string {
  if (value === null || value === '') return '-';
  switch (column.kind) {
    case 'rupiah':
      return typeof value === 'number' ? formatRupiah(value) : String(value);
    case 'number':
      return typeof value === 'number' ? value.toLocaleString('id-ID') : String(value);
    case 'percent':
      return typeof value === 'number' ? `${value.toLocaleString('id-ID')}%` : String(value);
    case 'date':
      return formatDate(String(value));
    case 'image':
      return 'Gambar';
    default:
      return String(value);
  }
}

/** Isi satu sel tabel. Status yang dikenal tampil sebagai lencana berikon, bukan warna saja. */
export function CellView({ column, value, compact = true }: { column: Column; value: Cell; compact?: boolean }) {
  if (column.kind === 'image') {
    return value ? (
      <img
        src={String(value)}
        alt=""
        loading="lazy"
        className={cn(
          'rounded-control border border-surface-100 object-cover',
          compact ? 'h-12 w-16' : 'aspect-4/3 w-full max-w-md',
        )}
      />
    ) : (
      <span className="text-ink-500">-</span>
    );
  }
  if (column.kind === 'status' && typeof value === 'string' && toneByWord[value]) {
    return <StatusBadge tone={toneByWord[value] as StatusTone}>{value}</StatusBadge>;
  }
  const text = cellText(column, value);
  if (column.kind === 'longtext' && compact) {
    return <span className="line-clamp-2 block max-w-64">{text}</span>;
  }
  return (
    <span
      className={cn(
        (column.kind === 'number' || column.kind === 'rupiah' || column.kind === 'percent') &&
          'tabular-nums',
        column.kind === 'id' && 'tabular-nums tracking-tight',
      )}
    >
      {text}
    </span>
  );
}

export function isNumericKind(column: Column): boolean {
  return column.kind === 'number' || column.kind === 'rupiah' || column.kind === 'percent';
}
