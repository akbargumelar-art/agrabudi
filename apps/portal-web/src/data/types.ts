/**
 * Bentuk data modul Portal untuk tampilan tabel. Ini kontrak tampilan sementara untuk
 * fase frontend: kolom final tiap modul mengikuti kamus data yang disahkan (PRD 2.8,
 * 4.5). Saat backend dibuat, bentuk yang dipakai lintas aplikasi dipindah ke
 * packages/contracts.
 */
export type ColumnKind =
  | 'text'
  | 'longtext'
  | 'id'
  | 'number'
  | 'rupiah'
  | 'percent'
  | 'date'
  | 'time'
  | 'status'
  | 'image'
  | 'person';

export type Column = {
  key: string;
  label: string;
  kind: ColumnKind;
  /** Boleh diisi lewat form tambah/ubah. */
  editable?: boolean;
  required?: boolean;
  /** Pilihan untuk kolom `status`. */
  options?: string[];
  /** Ikut dicari lewat kotak pencarian. Bawaannya teks, id, dan person. */
  searchable?: boolean;
};

export type Cell = string | number | null;

export type DataRow = {
  id: string;
  /** Pemilik data (salesforce). `null` = data rujukan tingkat cluster. */
  ownerId: string | null;
  teamId: string | null;
  cells: Record<string, Cell>;
};

export type StatTile = { label: string; value: string; note?: string };

export type ChartBar = { label: string; value: number; target?: number };

export type UploadSpec = {
  /** Nama kolom template, berurutan. */
  columns: string[];
  /** Kolom yang wajib angka bulat. */
  numericColumns: string[];
  /** Kolom yang wajib terisi. */
  requiredColumns: string[];
  /** Contoh isi berkas untuk dicoba. */
  sample: string;
};

export type ModuleDataset = {
  description: string;
  columns: Column[];
  rows: DataRow[];
  stats: StatTile[];
  chart: { title: string; unit: 'percent' | 'number'; bars: ChartBar[] } | null;
  /** Kolom yang punya filter pilihan. */
  filters: string[];
  /** Pengelola (Kelola) boleh tambah, ubah, hapus. */
  editable: boolean;
  /** Pengguna dengan akses Lihat boleh menambah data miliknya sendiri, mis. input order. */
  ownerCreate: boolean;
  upload: UploadSpec | null;
  /** Pilihan orang untuk kolom `person` sesuai cakupan sesi. */
  people: Array<{ id: string; name: string }>;
};

export type RowInput = { id?: string; ownerId?: string | null; cells: Record<string, Cell> };

export type UploadResult = { accepted: number; rejected: number };
