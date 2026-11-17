import { z } from 'zod';

/**
 * Bentuk data modul Portal untuk tampilan tabel. Kolom final tiap modul mengikuti kamus
 * data yang disahkan (PRD 2.8, 4.5). Server hanya mengisi bentuk ini untuk modul yang
 * sudah punya kontrak entitas; modul lain dijawab "belum terhubung".
 */
export const columnKindSchema = z.enum([
  'text',
  'longtext',
  'id',
  'number',
  'rupiah',
  'percent',
  'date',
  'time',
  'status',
  'image',
  'person',
  /** Tautan unduhan yang dibuka lewat API berizin, mis. CV pelamar. */
  'link',
]);
export type ColumnKind = z.infer<typeof columnKindSchema>;

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

export const cellSchema = z.union([z.string().max(5000), z.number().finite(), z.null()]);
export type Cell = z.infer<typeof cellSchema>;

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
  /** Bila `editable`: boleh menambah baris baru. Tidak diisi = boleh. */
  canCreate?: boolean;
  /** Bila `editable`: boleh menghapus baris. Tidak diisi = boleh. Order dan lamaran tidak pernah dihapus. */
  canDelete?: boolean;
  /** Pengguna dengan akses Lihat boleh menambah data miliknya sendiri, mis. input order. */
  ownerCreate: boolean;
  upload: UploadSpec | null;
  /** Pilihan orang untuk kolom `person` sesuai cakupan sesi. */
  people: Array<{ id: string; name: string }>;
};

export const rowInputSchema = z.object({
  id: z.string().min(1).max(64).optional(),
  ownerId: z.string().max(64).nullable().optional(),
  cells: z.record(z.string().max(64), cellSchema),
});
export type RowInput = z.infer<typeof rowInputSchema>;

export type UploadResult = { accepted: number; rejected: number };

/** Skema respons dataset untuk memvalidasi jawaban API di browser. */
export const moduleDatasetSchema = z.object({
  description: z.string(),
  columns: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      kind: columnKindSchema,
      editable: z.boolean().optional(),
      required: z.boolean().optional(),
      options: z.array(z.string()).optional(),
      searchable: z.boolean().optional(),
    }),
  ),
  rows: z.array(
    z.object({
      id: z.string(),
      ownerId: z.string().nullable(),
      teamId: z.string().nullable(),
      cells: z.record(z.string(), cellSchema),
    }),
  ),
  stats: z.array(z.object({ label: z.string(), value: z.string(), note: z.string().optional() })),
  chart: z
    .object({
      title: z.string(),
      unit: z.enum(['percent', 'number']),
      bars: z.array(
        z.object({ label: z.string(), value: z.number(), target: z.number().optional() }),
      ),
    })
    .nullable(),
  filters: z.array(z.string()),
  editable: z.boolean(),
  canCreate: z.boolean().optional(),
  canDelete: z.boolean().optional(),
  ownerCreate: z.boolean(),
  upload: z
    .object({
      columns: z.array(z.string()),
      numericColumns: z.array(z.string()),
      requiredColumns: z.array(z.string()),
      sample: z.string(),
    })
    .nullable(),
  people: z.array(z.object({ id: z.string(), name: z.string() })),
}) satisfies z.ZodType<ModuleDataset>;
