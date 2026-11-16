import {
  Button,
  StatusBadge,
  buttonClass,
  TableScroll,
  cardClass,
  cn,
  tableClass,
  tdClass,
  thClass,
  useToast,
} from '@agrabudi/ui';
import { Copy, FileUp } from 'lucide-react';
import { useId, useState } from 'react';
import { useDatasetMutations } from '../../data/queries';
import type { UploadSpec } from '../../data/types';

const MAX_BYTES = 5 * 1024 * 1024;

type ParsedRow = { line: number; values: Record<string, string>; problems: string[] };

/** Pemisah CSV sederhana yang paham tanda kutip. Semua nilai tetap teks, jadi nol di depan aman. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        value += '"';
        i++;
      } else if (char === '"') quoted = false;
      else value += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ',' || char === ';') {
      row.push(value);
      value = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else value += char;
  }
  if (value !== '' || row.length > 0) {
    row.push(value);
    rows.push(row);
  }
  return rows.filter((item) => item.some((cell) => cell.trim() !== ''));
}

export function validateCsv(text: string, spec: UploadSpec): { headerError: string | null; rows: ParsedRow[] } {
  const [header, ...body] = parseCsv(text.replace(/^\uFEFF/, ''));
  if (!header) return { headerError: 'Berkas kosong.', rows: [] };
  const names = header.map((item) => item.trim().toLowerCase());
  const missing = spec.columns.filter((column) => !names.includes(column));
  if (missing.length > 0) {
    return { headerError: `Kolom template tidak lengkap: ${missing.join(', ')}. Pakai template terbaru.`, rows: [] };
  }
  const rows = body.map((cells, index) => {
    const values = Object.fromEntries(names.map((name, position) => [name, (cells[position] ?? '').trim()]));
    const problems: string[] = [];
    for (const column of spec.requiredColumns) {
      if (!values[column]) problems.push(`${column} kosong`);
    }
    for (const column of spec.numericColumns) {
      const value = values[column];
      if (value && !/^\d+$/.test(value)) problems.push(`${column} bukan angka bulat`);
    }
    return { line: index + 2, values, problems };
  });
  return { headerError: null, rows };
}

/** Unggah CSV: periksa kolom dan isi dulu, baris salah ditolak, sisanya disimpan. */
export function UploadPanel({ path, spec }: { path: string; spec: UploadSpec }) {
  const inputId = useId();
  const toast = useToast();
  const { importRows } = useDatasetMutations(path);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<ReturnType<typeof validateCsv> | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load(name: string, text: string) {
    setFileName(name);
    setError(null);
    const parsed = validateCsv(text, spec);
    setResult(parsed);
    if (parsed.headerError) setError(parsed.headerError);
  }

  async function copyTemplate() {
    try {
      await navigator.clipboard.writeText(`${spec.columns.join(',')}\n`);
      toast.show({ tone: 'success', message: 'Baris judul template disalin.' });
    } catch {
      toast.show({ tone: 'danger', message: 'Browser menolak menyalin.' });
    }
  }

  const valid = result?.rows.filter((item) => item.problems.length === 0) ?? [];
  const invalid = result?.rows.filter((item) => item.problems.length > 0) ?? [];

  return (
    <section aria-labelledby={`${inputId}-judul`} className={cn(cardClass, 'flex flex-col gap-4 p-5')}>
      <div>
        <h2 id={`${inputId}-judul`} className="text-base font-bold">
          Unggah berkas CSV
        </h2>
        <p className="mt-1 text-sm text-ink-700">
          Kolom template: <span className="font-medium text-ink-900">{spec.columns.join(', ')}</span>. Maksimal 5 MB.
          Nilai dibaca sebagai teks, jadi ID dengan nol di depan tetap utuh.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <label
          htmlFor={inputId}
          className={cn(buttonClass({ size: 'sm' }), 'min-h-11 cursor-pointer')}
        >
          <FileUp aria-hidden className="size-4" />
          Pilih berkas
        </label>
        <input
          id={inputId}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            if (file.size > MAX_BYTES) {
              setResult(null);
              setError('Ukuran berkas lebih dari 5 MB. Pecah berkas lalu unggah bertahap.');
              return;
            }
            const reader = new FileReader();
            reader.onload = () => load(file.name, String(reader.result));
            reader.readAsText(file);
          }}
        />
        <Button variant="secondary" size="sm" className="min-h-11" onClick={() => load('contoh_unggah.csv', spec.sample)}>
          Coba dengan berkas contoh
        </Button>
        <Button variant="ghost" size="sm" className="min-h-11" onClick={() => void copyTemplate()}>
          <Copy aria-hidden className="size-4" />
          Salin judul template
        </Button>
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}

      {result && !result.headerError ? (
        <div className="flex flex-col gap-3" data-testid="hasil-periksa">
          <p className="text-sm">
            <span className="font-semibold">{fileName}</span>: {valid.length} baris siap disimpan, {invalid.length} baris
            ditolak.
          </p>
          <TableScroll label="Hasil pemeriksaan berkas">
            <table className={cn(tableClass, 'min-w-[36rem]')}>
              <thead>
                <tr>
                  <th scope="col" className={thClass}>
                    Baris
                  </th>
                  {spec.columns.map((column) => (
                    <th key={column} scope="col" className={thClass}>
                      {column}
                    </th>
                  ))}
                  <th scope="col" className={thClass}>
                    Hasil
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((item) => (
                  <tr key={item.line}>
                    <td className={tdClass}>{item.line}</td>
                    {spec.columns.map((column) => (
                      <td key={column} className={cn(tdClass, 'tabular-nums')}>
                        {item.values[column] || '-'}
                      </td>
                    ))}
                    <td className={tdClass}>
                      {item.problems.length === 0 ? (
                        <StatusBadge tone="success">Siap</StatusBadge>
                      ) : (
                        <span className="flex flex-col gap-1">
                          <StatusBadge tone="danger">Ditolak</StatusBadge>
                          <span className="text-xs text-ink-700">{item.problems.join(', ')}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="min-h-11"
              disabled={valid.length === 0 || importRows.isPending}
              onClick={async () => {
                try {
                  const saved = await importRows.mutateAsync({
                    fileName: fileName ?? 'unggahan.csv',
                    rows: valid.map((item) => item.values),
                    rejected: invalid.length,
                  });
                  toast.show({
                    tone: 'success',
                    message: `${saved.accepted} baris disimpan, ${saved.rejected} ditolak (contoh, hanya di browser ini).`,
                  });
                  setResult(null);
                  setFileName(null);
                } catch (failure) {
                  toast.show({ tone: 'danger', message: failure instanceof Error ? failure.message : 'Gagal menyimpan.' });
                }
              }}
            >
              Simpan {valid.length} baris
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="min-h-11"
              onClick={() => {
                setResult(null);
                setFileName(null);
              }}
            >
              Batal
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
