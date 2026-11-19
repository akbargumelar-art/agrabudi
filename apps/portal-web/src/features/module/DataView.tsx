import {
  Button,
  DataNotice,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  TableScroll,
  Textarea,
  cardClass,
  cn,
  formatRupiah,
  tableClass,
  tdClass,
  thClass,
  useToast,
} from '@agrabudi/ui';
import type { DataMeta } from '@agrabudi/contracts';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Copy, Plus, Search } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { useDatasetMutations } from '../../data/queries';
import type { Cell, Column, DataRow, ModuleDataset } from '../../data/types';
import { CellView, cellText, isNumericKind } from './cells';
import { UploadPanel } from './UploadPanel';

const PAGE_SIZE = 10;

type DataViewProps = { path: string; dataset: ModuleDataset; meta: DataMeta };

/**
 * Tabel modul Portal: ringkasan, grafik, cari, filter, urut, halaman, detail, dan
 * tambah/ubah/hapus sesuai hak akses. Hak akses datang dari adapter (meniru server),
 * bukan ditentukan halaman.
 */
export function DataView({ path, dataset, meta }: DataViewProps) {
  const toast = useToast();
  const { save, remove } = useDatasetMutations(path);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<DataRow | null>(null);
  const [editing, setEditing] = useState<DataRow | 'new' | null>(null);
  const [deleting, setDeleting] = useState<DataRow | null>(null);

  const { columns } = dataset;
  const canAdd = (dataset.editable && dataset.canCreate !== false) || dataset.ownerCreate;
  const canDelete = dataset.editable && dataset.canDelete !== false;

  const filterColumns = dataset.filters
    .map((key) => columns.find((column) => column.key === key))
    .filter((column): column is Column => column !== undefined);

  const visible = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    let rows = dataset.rows.filter((item) =>
      Object.entries(filters).every(
        ([key, value]) => value === '' || String(item.cells[key] ?? '') === value,
      ),
    );
    if (keyword) {
      rows = rows.filter((item) =>
        columns.some(
          (column) =>
            column.kind !== 'image' &&
            cellText(column, item.cells[column.key] ?? null)
              .toLowerCase()
              .includes(keyword),
        ),
      );
    }
    if (sort) {
      const column = columns.find((item) => item.key === sort.key);
      rows = [...rows].sort((a, b) => {
        const left = a.cells[sort.key] ?? null;
        const right = b.cells[sort.key] ?? null;
        if (left === null) return 1;
        if (right === null) return -1;
        if (column && isNumericKind(column)) return (Number(left) - Number(right)) * sort.dir;
        return String(left).localeCompare(String(right), 'id') * sort.dir;
      });
    }
    return rows;
  }, [dataset.rows, filters, search, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const pageRows = visible.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  async function copyCsv() {
    const header = columns
      .filter((column) => column.kind !== 'image')
      .map((column) => column.label);
    const lines = visible.map((item) =>
      columns
        .filter((column) => column.kind !== 'image')
        .map((column) => {
          const value = item.cells[column.key];
          const text = value === null || value === undefined ? '' : String(value);
          return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        })
        .join(','),
    );
    try {
      await navigator.clipboard.writeText([header.join(','), ...lines].join('\n'));
      toast.show({ tone: 'success', message: `${visible.length} baris disalin sebagai CSV.` });
    } catch {
      toast.show({
        tone: 'danger',
        message: 'Browser menolak menyalin. Coba lagi dari tombol yang sama.',
      });
    }
  }

  function toggleSort(key: string) {
    setSort((value) =>
      value?.key === key ? (value.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-prose text-sm text-ink-700">{dataset.description}</p>
        <DataNotice meta={meta} />
      </div>

      {dataset.stats.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 desktop:grid-cols-4">
          {dataset.stats.map((stat) => (
            <li key={stat.label} className={cn(cardClass, 'p-4')}>
              <p className="text-sm text-ink-700">{stat.label}</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums">{stat.value}</p>
              {stat.note ? <p className="mt-1 text-xs text-ink-500">{stat.note}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {dataset.chart && dataset.chart.bars.length > 0 ? <BarList chart={dataset.chart} /> : null}

      {dataset.upload ? <UploadPanel path={path} spec={dataset.upload} /> : null}

      <section aria-labelledby="judul-tabel" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3 rounded-panel border border-surface-100 bg-surface-50 p-3">
          <h2 id="judul-tabel" className="w-full text-base font-bold">
            Data modul
          </h2>
          <div className="min-w-48 flex-1">
            <label htmlFor={`cari-${path}`} className="sr-only">
              Cari data
            </label>
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-3 left-3 size-5 text-ink-500"
              />
              <Input
                id={`cari-${path}`}
                type="search"
                placeholder="Cari"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
                className="pl-10"
              />
            </div>
          </div>
          {filterColumns.map((column) => {
            const values = [
              ...new Set(
                dataset.rows
                  .map((item) => item.cells[column.key])
                  .filter((value) => value !== null && value !== ''),
              ),
            ]
              .map(String)
              .sort((a, b) => a.localeCompare(b, 'id'));
            return (
              <div key={column.key} className="w-full tablet:w-48">
                <label htmlFor={`filter-${path}-${column.key}`} className="sr-only">
                  Filter {column.label}
                </label>
                <Select
                  id={`filter-${path}-${column.key}`}
                  value={filters[column.key] ?? ''}
                  onChange={(event) => {
                    setFilters((value) => ({ ...value, [column.key]: event.target.value }));
                    setPage(0);
                  }}
                >
                  <option value="">Semua {column.label.toLowerCase()}</option>
                  {values.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
              </div>
            );
          })}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void copyCsv()}
              className="min-h-11"
            >
              <Copy aria-hidden className="size-4" />
              Salin CSV
            </Button>
            {canAdd ? (
              <Button size="sm" onClick={() => setEditing('new')} className="min-h-11">
                <Plus aria-hidden className="size-4" />
                Tambah data
              </Button>
            ) : null}
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            title={dataset.rows.length === 0 ? 'Belum ada data' : 'Tidak ada data yang cocok'}
            description={
              dataset.rows.length === 0
                ? 'Belum ada data dalam cakupan akun Anda.'
                : 'Ubah kata kunci atau filter.'
            }
          />
        ) : (
          <TableScroll
            label="Tabel data"
            scrollHint="Geser tabel ke samping untuk melihat semua kolom."
          >
            <table className={cn(tableClass, 'min-w-[44rem]')}>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      aria-sort={
                        sort?.key === column.key
                          ? sort.dir === 1
                            ? 'ascending'
                            : 'descending'
                          : undefined
                      }
                      className={cn(thClass, isNumericKind(column) && 'text-right')}
                    >
                      {column.kind === 'image' ? (
                        column.label
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleSort(column.key)}
                          className="inline-flex min-h-8 items-center gap-1 font-semibold hover:text-ink-900"
                        >
                          {column.label}
                          {sort?.key === column.key ? (
                            sort.dir === 1 ? (
                              <ArrowUp aria-hidden className="size-3.5" />
                            ) : (
                              <ArrowDown aria-hidden className="size-3.5" />
                            )
                          ) : null}
                        </button>
                      )}
                    </th>
                  ))}
                  <th scope="col" className={thClass}>
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((item) => (
                  <tr key={item.id} className="hover:bg-ink-soft focus-within:bg-ink-soft">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          tdClass,
                          isNumericKind(column) && 'text-right whitespace-nowrap',
                        )}
                      >
                        <CellView column={column} value={item.cells[column.key] ?? null} />
                      </td>
                    ))}
                    <td className={cn(tdClass, 'text-right')}>
                      <Button variant="ghost" size="sm" onClick={() => setDetail(item)}>
                        Detail
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}

        {visible.length > 0 ? (
          <nav
            aria-label="Halaman tabel"
            className="flex flex-wrap items-center justify-between gap-3 text-sm"
          >
            <p className="text-ink-700" data-testid="jumlah-baris">
              {current * PAGE_SIZE + 1}–{Math.min(visible.length, (current + 1) * PAGE_SIZE)} dari{' '}
              {visible.length} baris
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={current === 0}
                onClick={() => setPage(current - 1)}
                aria-label="Halaman sebelumnya"
                className="min-h-11 min-w-11"
              >
                <ChevronLeft aria-hidden className="size-4" />
              </Button>
              <span className="inline-flex items-center px-2 text-ink-700">
                {current + 1} / {pageCount}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={current >= pageCount - 1}
                onClick={() => setPage(current + 1)}
                aria-label="Halaman berikutnya"
                className="min-h-11 min-w-11"
              >
                <ChevronRight aria-hidden className="size-4" />
              </Button>
            </div>
          </nav>
        ) : null}
      </section>

      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title="Detail data"
        footer={
          detail && dataset.editable ? (
            <>
              {canDelete ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDeleting(detail);
                    setDetail(null);
                  }}
                >
                  Hapus
                </Button>
              ) : null}
              <Button
                size="sm"
                onClick={() => {
                  setEditing(detail);
                  setDetail(null);
                }}
              >
                Ubah
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setDetail(null)}>
              Tutup
            </Button>
          )
        }
      >
        {detail ? (
          <dl className="flex flex-col gap-3 text-sm">
            {columns.map((column) => (
              <div key={column.key} className="grid gap-1 tablet:grid-cols-[9rem_minmax(0,1fr)]">
                <dt className="text-ink-700">{column.label}</dt>
                <dd className="font-medium">
                  <CellView
                    column={column}
                    value={detail.cells[column.key] ?? null}
                    compact={false}
                  />
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </Modal>

      {editing ? (
        <RowForm
          dataset={dataset}
          row={editing === 'new' ? null : editing}
          busy={save.isPending}
          onClose={() => setEditing(null)}
          onSubmit={async (input) => {
            try {
              await save.mutateAsync(input);
              toast.show({
                tone: 'success',
                message:
                  editing === 'new'
                    ? 'Data ditambahkan (contoh, hanya di browser ini).'
                    : 'Perubahan tersimpan (contoh, hanya di browser ini).',
              });
              setEditing(null);
            } catch (error) {
              toast.show({
                tone: 'danger',
                message: error instanceof Error ? error.message : 'Gagal menyimpan.',
              });
            }
          }}
        />
      ) : null}

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Hapus data ini?"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeleting(null)}>
              Batal
            </Button>
            <Button
              size="sm"
              disabled={remove.isPending}
              onClick={async () => {
                if (!deleting) return;
                try {
                  await remove.mutateAsync(deleting.id);
                  toast.show({
                    tone: 'success',
                    message: 'Data dihapus (contoh, hanya di browser ini).',
                  });
                } catch (error) {
                  toast.show({
                    tone: 'danger',
                    message: error instanceof Error ? error.message : 'Gagal menghapus.',
                  });
                }
                setDeleting(null);
              }}
            >
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm">
          Data yang dihapus tidak tampil lagi di tabel. Di mode contoh, muat ulang halaman
          mengembalikannya.
        </p>
      </Modal>
    </div>
  );
}

function BarList({ chart }: { chart: NonNullable<ModuleDataset['chart']> }) {
  const max = Math.max(
    chart.unit === 'percent' ? 120 : 0,
    ...chart.bars.map((bar) => bar.value),
    1,
  );
  const format = (value: number) =>
    chart.unit === 'percent'
      ? `${value.toLocaleString('id-ID')}%`
      : value >= 100_000
        ? formatRupiah(value)
        : value.toLocaleString('id-ID');
  return (
    <section aria-label={chart.title} className={cn(cardClass, 'p-5')}>
      <h2 className="text-base font-bold">{chart.title}</h2>
      {chart.unit === 'percent' ? (
        <p className="mt-1 text-xs text-ink-700">Garis tipis menandai target 100%.</p>
      ) : null}
      <ul className="mt-4 flex flex-col gap-2.5">
        {chart.bars.map((bar) => {
          const reached = bar.target === undefined || bar.value >= bar.target;
          return (
            <li
              key={bar.label}
              className="grid grid-cols-[minmax(6rem,10rem)_minmax(0,1fr)_auto] items-center gap-3 text-sm"
            >
              <span className="truncate text-ink-700" title={bar.label}>
                {bar.label}
              </span>
              <span className="relative h-3 rounded-full bg-surface-100">
                <span
                  className={cn(
                    'absolute inset-y-0 left-0 rounded-full',
                    reached ? 'bg-brand-red' : 'bg-brand-gold',
                  )}
                  style={{ width: `${Math.max(2, (bar.value / max) * 100)}%` }}
                />
                {bar.target !== undefined ? (
                  <span
                    aria-hidden
                    className="absolute -inset-y-1 w-px bg-ink-900"
                    style={{ left: `${(bar.target / max) * 100}%` }}
                  />
                ) : null}
              </span>
              <span className="font-semibold tabular-nums">{format(bar.value)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type RowFormProps = {
  dataset: ModuleDataset;
  row: DataRow | null;
  busy: boolean;
  onClose: () => void;
  onSubmit: (input: {
    id?: string;
    ownerId?: string | null;
    cells: Record<string, Cell>;
  }) => Promise<void>;
};

function RowForm({ dataset, row, busy, onClose, onSubmit }: RowFormProps) {
  const fields = dataset.columns.filter((column) => column.editable);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((column) => {
        if (column.kind === 'person')
          return [column.key, row?.ownerId ?? dataset.people[0]?.id ?? ''];
        const value = row?.cells[column.key];
        return [column.key, value === null || value === undefined ? '' : String(value)];
      }),
    ),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    const cells: Record<string, Cell> = {};
    let ownerId: string | null | undefined;
    for (const column of fields) {
      const raw = (values[column.key] ?? '').trim();
      if (column.required && raw === '') {
        nextErrors[column.key] = `${column.label} wajib diisi.`;
        continue;
      }
      if (column.kind === 'person') {
        ownerId = raw || null;
        continue;
      }
      if (isNumericKind(column)) {
        if (raw === '') {
          cells[column.key] = null;
          continue;
        }
        const valid = column.kind === 'percent' ? /^\d+([.,]\d+)?$/.test(raw) : /^\d+$/.test(raw);
        if (!valid) {
          nextErrors[column.key] =
            column.kind === 'percent'
              ? 'Isi angka, boleh desimal.'
              : 'Isi angka bulat tanpa titik.';
          continue;
        }
        cells[column.key] = Number(raw.replace(',', '.'));
        continue;
      }
      cells[column.key] = raw === '' ? null : raw;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    await onSubmit({ id: row?.id, ownerId, cells });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={row ? 'Ubah data' : 'Tambah data'}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Batal
          </Button>
          <Button size="sm" type="submit" form="form-data" disabled={busy}>
            Simpan
          </Button>
        </>
      }
    >
      <form
        id="form-data"
        noValidate
        onSubmit={(event) => void submit(event)}
        className="flex flex-col gap-4"
      >
        {fields.map((column) => {
          const id = `isian-${column.key}`;
          const error = errors[column.key];
          const value = values[column.key] ?? '';
          let control;
          if (column.kind === 'person') {
            control = (
              <Select
                id={id}
                value={value}
                onChange={(event) => set(column.key, event.target.value)}
              >
                {dataset.people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </Select>
            );
          } else if (column.kind === 'status') {
            control = (
              <Select
                id={id}
                value={value}
                onChange={(event) => set(column.key, event.target.value)}
                aria-invalid={Boolean(error)}
              >
                <option value="">Pilih {column.label.toLowerCase()}</option>
                {(column.options ?? []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            );
          } else if (column.kind === 'longtext') {
            control = (
              <Textarea
                id={id}
                value={value}
                onChange={(event) => set(column.key, event.target.value)}
                aria-invalid={Boolean(error)}
              />
            );
          } else if (column.kind === 'image') {
            control = (
              <div className="flex flex-col gap-2">
                {value ? (
                  <img
                    src={value}
                    alt=""
                    className="h-24 w-32 rounded-control border border-surface-100 object-cover"
                  />
                ) : null}
                <Input
                  id={id}
                  type="file"
                  accept="image/*"
                  className="py-2"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    if (file.size > 3 * 1024 * 1024) {
                      setErrors((current) => ({
                        ...current,
                        [column.key]: 'Ukuran gambar paling besar 3 MB.',
                      }));
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => set(column.key, String(reader.result));
                    reader.readAsDataURL(file);
                  }}
                />
              </div>
            );
          } else {
            control = (
              <Input
                id={id}
                type={column.kind === 'date' ? 'date' : column.kind === 'time' ? 'time' : 'text'}
                inputMode={isNumericKind(column) ? 'decimal' : undefined}
                value={value}
                onChange={(event) => set(column.key, event.target.value)}
                aria-invalid={Boolean(error)}
              />
            );
          }
          return (
            <Field
              key={column.key}
              label={`${column.label}${column.required ? '' : ' (opsional)'}`}
              htmlFor={id}
              error={error}
            >
              {control}
            </Field>
          );
        })}
        <p className="text-xs text-ink-700">
          Mode contoh: perubahan hanya tersimpan di browser ini sampai halaman dimuat ulang.
        </p>
      </form>
    </Modal>
  );
}
