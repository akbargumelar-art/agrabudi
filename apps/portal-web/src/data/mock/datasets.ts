import type { BusinessUnit } from '@agrabudi/contracts';
import {
  avatarArt,
  documentArt,
  popArt,
  productArt,
  programArt,
  storeArt,
  videoArt,
  visitArt,
} from '@agrabudi/ui/mock-art';
import { mockCuanProducts } from '@agrabudi/ui/mock-cuan';
import type { ChartBar, Column, DataRow, ModuleDataset, StatTile, UploadSpec } from '../types';
import {
  customers,
  outlets,
  people,
  personById,
  salesforceOf,
  teamName,
  teams,
  type Person,
} from './org';

/**
 * DATASET CONTOH per menu Portal. Semua angka rekaan untuk mencoba tampilan dan alur;
 * rumus capaian di sini hanya realisasi dibagi target, bukan rumus KPI resmi (PRD D-07).
 */
export type DatasetSpec = {
  description: string;
  columns: Column[];
  rows: DataRow[];
  filters?: string[];
  editable?: boolean;
  ownerCreate?: boolean;
  upload?: UploadSpec;
  /** Unit salesforce yang muncul di pilihan kolom `person`. */
  personUnits?: BusinessUnit[];
  stats?: (rows: DataRow[]) => StatTile[];
  chart?: (rows: DataRow[]) => ModuleDataset['chart'];
};

// ---------------------------------------------------------------- utilitas

function seeded(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
}

type Random = () => number;

const between = (random: Random, min: number, max: number) =>
  Math.round(min + random() * (max - min));
const pickOne = <T,>(random: Random, items: readonly T[]): T =>
  items[Math.floor(random() * items.length)] as T;
const round1 = (value: number) => Math.round(value * 10) / 10;
const pct = (real: number, target: number) => (target > 0 ? round1((real / target) * 100) : 0);

const rupiahShort = (value: number) =>
  value >= 1_000_000_000
    ? `Rp${round1(value / 1_000_000_000).toLocaleString('id-ID')} M`
    : value >= 1_000_000
      ? `Rp${round1(value / 1_000_000).toLocaleString('id-ID')} jt`
      : `Rp${value.toLocaleString('id-ID')}`;

const num = (value: number) => value.toLocaleString('id-ID');

/** Tanggal di bulan November 2026, mundur dari tanggal 15. */
function novDate(random: Random): string {
  return `2026-11-${String(between(random, 1, 15)).padStart(2, '0')}`;
}

function anyDate(random: Random): string {
  const month = pickOne(random, ['09', '10', '11']);
  return `2026-${month}-${String(between(random, 1, month === '11' ? 15 : 28)).padStart(2, '0')}`;
}

function row(id: string, owner: Person | null, cells: Record<string, string | number | null>): DataRow {
  return { id, ownerId: owner?.id ?? null, teamId: owner?.teamId ?? null, cells };
}

const sumBy = (rows: DataRow[], key: string) =>
  rows.reduce((total, item) => total + (typeof item.cells[key] === 'number' ? (item.cells[key] as number) : 0), 0);

function personCol(label = 'Salesforce'): Column {
  return { key: 'salesforce', label, kind: 'person', editable: true, required: true };
}

const PERIOD = 'Nov 2026';

// ---------------------------------------------------------------- keluarga dataset

type MetricOptions = {
  unit: BusinessUnit;
  description: string;
  valueKind: 'number' | 'rupiah' | 'percent';
  target: [number, number];
  chartTitle?: string;
};

/** Target dan realisasi per salesforce. */
function metricPerSalesforce(seed: string, options: MetricOptions): DatasetSpec {
  const random = seeded(seed);
  const rows = salesforceOf(options.unit).map((person) => {
    const target = between(random, options.target[0], options.target[1]);
    const real = Math.round(target * (0.55 + random() * 0.6));
    const ach = pct(real, target);
    return row(`${seed}-${person.id}`, person, {
      salesforce: person.name,
      tim: teamName(person.teamId),
      periode: PERIOD,
      target,
      realisasi: real,
      capaian: ach,
      status: ach >= 100 ? 'Tercapai' : 'Belum tercapai',
    });
  });
  const valueKind = options.valueKind;
  return {
    description: options.description,
    columns: [
      personCol(),
      { key: 'tim', label: 'Tim', kind: 'text' },
      { key: 'periode', label: 'Periode', kind: 'text', editable: true, required: true },
      { key: 'target', label: 'Target', kind: valueKind, editable: true, required: true },
      { key: 'realisasi', label: 'Realisasi', kind: valueKind, editable: true, required: true },
      { key: 'capaian', label: 'Capaian', kind: 'percent' },
      { key: 'status', label: 'Status', kind: 'status', options: ['Tercapai', 'Belum tercapai'] },
    ],
    rows,
    filters: ['tim', 'status'],
    editable: true,
    personUnits: [options.unit],
    stats: (scoped) => {
      const target = sumBy(scoped, 'target');
      const real = sumBy(scoped, 'realisasi');
      const fmt = valueKind === 'rupiah' ? rupiahShort : num;
      return [
        { label: 'Target', value: valueKind === 'percent' ? '-' : fmt(target), note: PERIOD },
        { label: 'Realisasi', value: valueKind === 'percent' ? '-' : fmt(real) },
        { label: 'Capaian', value: `${pct(real, target).toLocaleString('id-ID')}%` },
        {
          label: 'Salesforce tercapai',
          value: `${scoped.filter((item) => item.cells.status === 'Tercapai').length} dari ${scoped.length}`,
        },
      ];
    },
    chart: (scoped) => ({
      title: options.chartTitle ?? 'Capaian per salesforce',
      unit: 'percent',
      bars: scoped.map((item) => ({
        label: String(item.cells.salesforce),
        value: Number(item.cells.capaian),
        target: 100,
      })),
    }),
  };
}

type TransactionOptions = {
  unit: BusinessUnit;
  description: string;
  products: Array<[string, number]>;
  count: number;
  placeLabel?: string;
  places?: string[];
  prefix: string;
};

/** Transaksi penjualan harian. */
function transactions(seed: string, options: TransactionOptions): DatasetSpec {
  const random = seeded(seed);
  const salesforce = salesforceOf(options.unit);
  const rows = Array.from({ length: options.count }, (_, index) => {
    const person = pickOne(random, salesforce);
    const [product, price] = pickOne(random, options.products);
    const qty = between(random, 1, 40);
    const place = options.places
      ? pickOne(random, options.places)
      : pickOne(random, outlets.filter((outlet) => outlet.salesforceId === person.id)).name;
    return row(`${seed}-${index}`, person, {
      tanggal: novDate(random),
      nomor: `${options.prefix}-2611-${String(1000 + index * 7).padStart(5, '0')}`,
      tempat: place,
      produk: product,
      jumlah: qty,
      nilai: qty * price,
      salesforce: person.name,
    });
  }).sort((a, b) => String(b.cells.tanggal).localeCompare(String(a.cells.tanggal)));
  return {
    description: options.description,
    columns: [
      { key: 'tanggal', label: 'Tanggal', kind: 'date', editable: true, required: true },
      { key: 'nomor', label: 'No. transaksi', kind: 'id', editable: true, required: true },
      { key: 'tempat', label: options.placeLabel ?? 'Outlet', kind: 'text', editable: true, required: true },
      {
        key: 'produk',
        label: 'Produk',
        kind: 'status',
        editable: true,
        required: true,
        options: options.products.map(([name]) => name),
      },
      { key: 'jumlah', label: 'Jumlah', kind: 'number', editable: true, required: true },
      { key: 'nilai', label: 'Nilai', kind: 'rupiah', editable: true, required: true },
      personCol(),
    ],
    rows,
    filters: ['produk', 'salesforce'],
    editable: true,
    personUnits: [options.unit],
    stats: (scoped) => [
      { label: 'Transaksi', value: num(scoped.length), note: '1–15 Nov 2026' },
      { label: 'Jumlah unit', value: num(sumBy(scoped, 'jumlah')) },
      { label: 'Nilai', value: rupiahShort(sumBy(scoped, 'nilai')) },
    ],
    chart: (scoped) => ({
      title: 'Nilai per produk',
      unit: 'number',
      bars: options.products.map(([name]) => ({
        label: name,
        value: sumBy(
          scoped.filter((item) => item.cells.produk === name),
          'nilai',
        ),
      })),
    }),
  };
}

const outletColumns: Column[] = [
  { key: 'foto', label: 'Foto', kind: 'image', editable: true },
  { key: 'digipos', label: 'ID Digipos', kind: 'id', editable: true, required: true },
  { key: 'nama', label: 'Nama outlet', kind: 'text', editable: true, required: true },
  { key: 'pemilik', label: 'Pemilik', kind: 'text', editable: true, required: true },
  { key: 'kecamatan', label: 'Kecamatan', kind: 'text', editable: true, required: true },
  {
    key: 'tap',
    label: 'TAP',
    kind: 'status',
    editable: true,
    required: true,
    options: ['TAP Kota Cirebon', 'TAP Sumber', 'TAP Kuningan'],
  },
  personCol(),
  { key: 'status', label: 'Status', kind: 'status', editable: true, required: true, options: ['Aktif', 'Tidak aktif'] },
  { key: 'terdaftar', label: 'Terdaftar', kind: 'date', editable: true },
];

function outletRegister(seed: string, description: string): DatasetSpec {
  const random = seeded(seed);
  const rows = outlets.map((outlet) => {
    const person = personById(outlet.salesforceId) ?? null;
    return row(`${seed}-${outlet.id}`, person, {
      foto: storeArt(outlet.name, outlet.digiposId),
      digipos: outlet.digiposId,
      nama: outlet.name,
      pemilik: outlet.owner,
      kecamatan: outlet.district,
      tap: outlet.tap,
      salesforce: person?.name ?? '-',
      status: random() > 0.12 ? 'Aktif' : 'Tidak aktif',
      terdaftar: `20${between(random, 23, 26)}-${String(between(random, 1, 12)).padStart(2, '0')}-${String(between(random, 1, 28)).padStart(2, '0')}`,
    });
  });
  return {
    description,
    columns: outletColumns,
    rows,
    filters: ['tap', 'status', 'salesforce'],
    editable: true,
    personUnits: ['mobile'],
    stats: (scoped) => [
      { label: 'Outlet', value: num(scoped.length) },
      { label: 'Aktif', value: num(scoped.filter((item) => item.cells.status === 'Aktif').length) },
      {
        label: 'TAP',
        value: num(new Set(scoped.map((item) => item.cells.tap)).size),
      },
    ],
  };
}

function outletStock(seed: string, description: string, product: string): DatasetSpec {
  const random = seeded(seed);
  const rows = outlets.map((outlet) => {
    const person = personById(outlet.salesforceId) ?? null;
    const start = between(random, 10, 120);
    const incoming = between(random, 0, 100);
    const sold = Math.min(start + incoming, between(random, 5, 140));
    return row(`${seed}-${outlet.id}`, person, {
      digipos: outlet.digiposId,
      nama: outlet.name,
      tap: outlet.tap,
      produk: product,
      awal: start,
      masuk: incoming,
      terjual: sold,
      sisa: start + incoming - sold,
      salesforce: person?.name ?? '-',
      diperbarui: novDate(random),
    });
  });
  return {
    description,
    columns: [
      { key: 'digipos', label: 'ID Digipos', kind: 'id' },
      { key: 'nama', label: 'Outlet', kind: 'text' },
      { key: 'tap', label: 'TAP', kind: 'status', options: ['TAP Kota Cirebon', 'TAP Sumber', 'TAP Kuningan'] },
      { key: 'produk', label: 'Produk', kind: 'text' },
      { key: 'awal', label: 'Stok awal', kind: 'number', editable: true, required: true },
      { key: 'masuk', label: 'Masuk', kind: 'number', editable: true, required: true },
      { key: 'terjual', label: 'Terjual', kind: 'number', editable: true, required: true },
      { key: 'sisa', label: 'Sisa', kind: 'number' },
      personCol(),
      { key: 'diperbarui', label: 'Diperbarui', kind: 'date' },
    ],
    rows,
    filters: ['tap', 'salesforce'],
    editable: true,
    personUnits: ['mobile'],
    stats: (scoped) => [
      { label: 'Stok sisa', value: num(sumBy(scoped, 'sisa')), note: 'Data snapshot, bukan real-time' },
      { label: 'Terjual', value: num(sumBy(scoped, 'terjual')) },
      {
        label: 'Outlet stok menipis',
        value: num(scoped.filter((item) => Number(item.cells.sisa) < 10).length),
        note: 'Sisa di bawah 10',
      },
    ],
  };
}

function outletOmzet(seed: string): DatasetSpec {
  const random = seeded(seed);
  const rows = outlets.map((outlet) => {
    const person = personById(outlet.salesforceId) ?? null;
    const before = between(random, 2_000_000, 25_000_000);
    const now = Math.round(before * (0.75 + random() * 0.6));
    return row(`${seed}-${outlet.id}`, person, {
      digipos: outlet.digiposId,
      nama: outlet.name,
      tap: outlet.tap,
      okt: before,
      nov: now,
      tumbuh: round1(((now - before) / before) * 100),
      salesforce: person?.name ?? '-',
    });
  });
  return {
    description: 'Omzet pembelian outlet per bulan.',
    columns: [
      { key: 'digipos', label: 'ID Digipos', kind: 'id' },
      { key: 'nama', label: 'Outlet', kind: 'text' },
      { key: 'tap', label: 'TAP', kind: 'status', options: ['TAP Kota Cirebon', 'TAP Sumber', 'TAP Kuningan'] },
      { key: 'okt', label: 'Omzet Okt', kind: 'rupiah' },
      { key: 'nov', label: 'Omzet Nov', kind: 'rupiah' },
      { key: 'tumbuh', label: 'Pertumbuhan', kind: 'percent' },
      personCol(),
    ],
    rows,
    filters: ['tap', 'salesforce'],
    stats: (scoped) => {
      const before = sumBy(scoped, 'okt');
      const now = sumBy(scoped, 'nov');
      return [
        { label: 'Omzet Okt', value: rupiahShort(before) },
        { label: 'Omzet Nov', value: rupiahShort(now) },
        { label: 'Pertumbuhan', value: `${round1(((now - before) / Math.max(before, 1)) * 100).toLocaleString('id-ID')}%` },
      ];
    },
    chart: (scoped) => ({
      title: 'Lima outlet omzet tertinggi (Nov)',
      unit: 'number',
      bars: [...scoped]
        .sort((a, b) => Number(b.cells.nov) - Number(a.cells.nov))
        .slice(0, 5)
        .map((item) => ({ label: String(item.cells.nama), value: Number(item.cells.nov) })),
    }),
  };
}

type PhotoKind = 'visit' | 'pop' | 'video' | 'doc' | 'booth';

function photoLog(
  seed: string,
  options: { unit: BusinessUnit; description: string; kind: PhotoKind; count: number; notes: string[] },
): DatasetSpec {
  const random = seeded(seed);
  const salesforce = salesforceOf(options.unit);
  const rows = Array.from({ length: options.count }, (_, index) => {
    const person = pickOne(random, salesforce);
    const ownOutlets = outlets.filter((outlet) => outlet.salesforceId === person.id);
    const place =
      options.unit === 'mobile' && ownOutlets.length > 0
        ? pickOne(random, ownOutlets).name
        : pickOne(random, ['Perum Griya Contoh', 'Pasar Contoh', 'Balai Desa Contoh', 'Alun-alun Contoh', 'Kampus Contoh']);
    const note = pickOne(random, options.notes);
    const image =
      options.kind === 'pop'
        ? popArt(note, `${seed}-${index}`)
        : options.kind === 'video'
          ? videoArt(note, `${seed}-${index}`)
          : options.kind === 'doc'
            ? documentArt(`${note}.pdf`)
            : visitArt(place, `${seed}-${index}`, options.kind !== 'booth');
    return row(`${seed}-${index}`, person, {
      foto: image,
      tanggal: novDate(random),
      tempat: place,
      catatan: note,
      salesforce: person.name,
      status: pickOne(random, ['Terverifikasi', 'Terverifikasi', 'Menunggu verifikasi']),
    });
  }).sort((a, b) => String(b.cells.tanggal).localeCompare(String(a.cells.tanggal)));
  return {
    description: options.description,
    columns: [
      { key: 'foto', label: options.kind === 'video' ? 'Video' : options.kind === 'doc' ? 'Berkas' : 'Foto', kind: 'image', editable: true },
      { key: 'tanggal', label: 'Tanggal', kind: 'date', editable: true, required: true },
      { key: 'tempat', label: options.unit === 'mobile' ? 'Outlet' : 'Lokasi', kind: 'text', editable: true, required: true },
      { key: 'catatan', label: options.kind === 'video' ? 'Judul' : 'Catatan', kind: 'longtext', editable: true, required: true },
      personCol(),
      { key: 'status', label: 'Status', kind: 'status', options: ['Terverifikasi', 'Menunggu verifikasi'] },
    ],
    rows,
    filters: ['salesforce', 'status'],
    editable: true,
    ownerCreate: true,
    personUnits: [options.unit],
    stats: (scoped) => [
      { label: 'Dokumentasi', value: num(scoped.length), note: '1–15 Nov 2026' },
      { label: 'Menunggu verifikasi', value: num(scoped.filter((item) => item.cells.status === 'Menunggu verifikasi').length) },
    ],
  };
}

function tickets(seed: string, unit: BusinessUnit): DatasetSpec {
  const random = seeded(seed);
  const salesforce = salesforceOf(unit);
  const categories =
    unit === 'household'
      ? ['Gangguan jaringan', 'Tagihan', 'Pemasangan tertunda', 'Perangkat']
      : ['Stok kosong', 'Saldo Digipos', 'Materi promosi', 'Kartu gagal aktif'];
  const rows = Array.from({ length: 14 }, (_, index) => {
    const person = pickOne(random, salesforce);
    const reporter =
      unit === 'household'
        ? (pickOne(random, customers).name)
        : pickOne(random, outlets.filter((outlet) => outlet.salesforceId === person.id)).name;
    return row(`${seed}-${index}`, person, {
      nomor: `TKT-2611-${String(201 + index).padStart(4, '0')}`,
      tanggal: novDate(random),
      pelapor: reporter,
      kategori: pickOne(random, categories),
      uraian: 'Uraian keluhan contoh dari pelapor.',
      salesforce: person.name,
      status: pickOne(random, ['Baru', 'Diproses', 'Diproses', 'Selesai', 'Selesai']),
    });
  }).sort((a, b) => String(b.cells.tanggal).localeCompare(String(a.cells.tanggal)));
  return {
    description: 'Tiket keluhan beserta penanggung jawab dan statusnya.',
    columns: [
      { key: 'nomor', label: 'No. tiket', kind: 'id', editable: true, required: true },
      { key: 'tanggal', label: 'Tanggal', kind: 'date', editable: true, required: true },
      { key: 'pelapor', label: 'Pelapor', kind: 'text', editable: true, required: true },
      { key: 'kategori', label: 'Kategori', kind: 'status', editable: true, required: true, options: categories },
      { key: 'uraian', label: 'Uraian', kind: 'longtext', editable: true, required: true },
      personCol('Penanggung jawab'),
      { key: 'status', label: 'Status', kind: 'status', editable: true, required: true, options: ['Baru', 'Diproses', 'Selesai'] },
    ],
    rows,
    filters: ['status', 'kategori'],
    editable: true,
    ownerCreate: true,
    personUnits: [unit],
    stats: (scoped) => [
      { label: 'Tiket', value: num(scoped.length) },
      { label: 'Baru', value: num(scoped.filter((item) => item.cells.status === 'Baru').length) },
      { label: 'Diproses', value: num(scoped.filter((item) => item.cells.status === 'Diproses').length) },
      { label: 'Selesai', value: num(scoped.filter((item) => item.cells.status === 'Selesai').length) },
    ],
  };
}

function fees(seed: string, unit: BusinessUnit, component: string): DatasetSpec {
  const random = seeded(seed);
  const periods = ['Agu 2026', 'Sep 2026', 'Okt 2026', 'Nov 2026'];
  const rows = periods.map((period, index) => {
    const base = between(random, unit === 'mobile' ? 800_000_000 : 300_000_000, unit === 'mobile' ? 1_400_000_000 : 600_000_000);
    const rate = round1(1 + random() * 2);
    return row(`${seed}-${index}`, null, {
      periode: period,
      komponen: component,
      dasar: base,
      tarif: rate,
      nilai: Math.round((base * rate) / 100),
      status: index === periods.length - 1 ? 'Draft' : 'Final',
    });
  });
  return {
    description: `Perhitungan ${component.toLowerCase()} per periode. Tarif dan dasar perhitungan contoh, bukan rumus resmi.`,
    columns: [
      { key: 'periode', label: 'Periode', kind: 'text', editable: true, required: true },
      { key: 'komponen', label: 'Komponen', kind: 'text' },
      { key: 'dasar', label: 'Dasar perhitungan', kind: 'rupiah', editable: true, required: true },
      { key: 'tarif', label: 'Tarif', kind: 'percent', editable: true, required: true },
      { key: 'nilai', label: 'Nilai', kind: 'rupiah', editable: true, required: true },
      { key: 'status', label: 'Status', kind: 'status', editable: true, required: true, options: ['Draft', 'Final'] },
    ],
    rows,
    filters: ['status'],
    editable: true,
    stats: (scoped) => [
      { label: 'Total 4 bulan', value: rupiahShort(sumBy(scoped, 'nilai')) },
      { label: 'Periode final', value: num(scoped.filter((item) => item.cells.status === 'Final').length) },
    ],
    chart: (scoped) => ({
      title: 'Nilai per periode',
      unit: 'number',
      bars: scoped.map((item) => ({ label: String(item.cells.periode), value: Number(item.cells.nilai) })),
    }),
  };
}

function targets(seed: string, unit: BusinessUnit): DatasetSpec {
  const random = seeded(seed);
  const rows = salesforceOf(unit).map((person) =>
    row(`${seed}-${person.id}`, person, {
      salesforce: person.name,
      periode: PERIOD,
      t1: between(random, 80, 200),
      t2: between(random, unit === 'household' ? 10 : 200, unit === 'household' ? 40 : 600),
      t3: between(random, 20_000_000, 90_000_000),
    }),
  );
  const labels =
    unit === 'household'
      ? ['Target order', 'Target PS', 'Target collection']
      : ['Target perdana', 'Target voucher', 'Target omzet'];
  return {
    description: 'Target bulanan per salesforce. Diubah oleh Admin unit.',
    columns: [
      personCol(),
      { key: 'periode', label: 'Periode', kind: 'text', editable: true, required: true },
      { key: 't1', label: labels[0] as string, kind: 'number', editable: true, required: true },
      { key: 't2', label: labels[1] as string, kind: 'number', editable: true, required: true },
      { key: 't3', label: labels[2] as string, kind: 'rupiah', editable: true, required: true },
    ],
    rows,
    filters: ['salesforce'],
    editable: true,
    personUnits: [unit],
    stats: (scoped) => [
      { label: labels[0] as string, value: num(sumBy(scoped, 't1')), note: PERIOD },
      { label: labels[1] as string, value: num(sumBy(scoped, 't2')) },
      { label: labels[2] as string, value: rupiahShort(sumBy(scoped, 't3')) },
    ],
  };
}

function uploads(seed: string, module: string, spec: UploadSpec): DatasetSpec {
  const random = seeded(seed);
  const uploaders = ['Teguh Santoso', 'Maya Kartika'];
  const rows = Array.from({ length: 5 }, (_, index) => {
    const accepted = between(random, 120, 900);
    const rejected = index === 1 ? between(random, 3, 20) : 0;
    return row(`${seed}-${index}`, null, {
      tanggal: `2026-11-${String(14 - index * 3).padStart(2, '0')}`,
      berkas: `${module.toLowerCase().replace(/\s+/g, '_')}_${14 - index * 3}nov.csv`,
      diterima: accepted,
      ditolak: rejected,
      oleh: pickOne(random, uploaders),
      status: rejected > 0 ? 'Sebagian ditolak' : 'Berhasil',
    });
  });
  return {
    description: `Riwayat unggahan ${module}. Unggah berkas CSV sesuai template; baris yang salah ditolak dan tidak ikut tersimpan.`,
    columns: [
      { key: 'tanggal', label: 'Tanggal', kind: 'date' },
      { key: 'berkas', label: 'Nama berkas', kind: 'text' },
      { key: 'diterima', label: 'Diterima', kind: 'number' },
      { key: 'ditolak', label: 'Ditolak', kind: 'number' },
      { key: 'oleh', label: 'Diunggah oleh', kind: 'text' },
      { key: 'status', label: 'Status', kind: 'status', options: ['Berhasil', 'Sebagian ditolak'] },
    ],
    rows,
    filters: ['status'],
    upload: spec,
    stats: (scoped) => [
      { label: 'Unggahan', value: num(scoped.length) },
      { label: 'Baris diterima', value: num(sumBy(scoped, 'diterima')) },
      { label: 'Baris ditolak', value: num(sumBy(scoped, 'ditolak')) },
    ],
  };
}

const roleLabels: Record<Person['role'], string> = {
  web_admin: 'Admin Web',
  admin: 'Admin',
  manager: 'Manager',
  supervisor: 'Supervisor',
  salesforce: 'Salesforce',
};
const unitLabels: Record<BusinessUnit, string> = {
  mobile: 'Mobile',
  household: 'Household',
  direct_sales: 'Direct Sales',
};

function users(seed: string, units: BusinessUnit[]): DatasetSpec {
  const rows = people
    .filter((person) => person.unit === null || units.includes(person.unit))
    .map((person) =>
      row(`${seed}-${person.id}`, null, {
        foto: avatarArt(person.name),
        nama: person.name,
        username: person.username ?? '(belum punya akun)',
        peran: roleLabels[person.role],
        unit: person.unit ? unitLabels[person.unit] : 'Lintas unit',
        tim: teamName(person.teamId),
        status: person.username ? 'Aktif' : 'Belum aktif',
      }),
    );
  return {
    description: 'Pengguna operasional. Akun dengan username bisa dipakai login di pratinjau dengan kata sandi contoh123.',
    columns: [
      { key: 'foto', label: 'Foto', kind: 'image' },
      { key: 'nama', label: 'Nama', kind: 'text', editable: true, required: true },
      { key: 'username', label: 'Username', kind: 'id', editable: true, required: true },
      { key: 'peran', label: 'Peran', kind: 'status', editable: true, required: true, options: ['Admin', 'Manager', 'Supervisor', 'Salesforce'] },
      { key: 'unit', label: 'Unit', kind: 'status', editable: true, required: true, options: ['Mobile', 'Household', 'Direct Sales', 'Lintas unit'] },
      { key: 'tim', label: 'Tim', kind: 'status', editable: true, options: teams.map((team) => team.name) },
      { key: 'status', label: 'Status', kind: 'status', editable: true, required: true, options: ['Aktif', 'Belum aktif', 'Nonaktif'] },
    ],
    rows,
    filters: ['peran', 'unit', 'status'],
    editable: true,
    stats: (scoped) => [
      { label: 'Pengguna', value: num(scoped.length) },
      { label: 'Punya akun', value: num(scoped.filter((item) => item.cells.status === 'Aktif').length) },
    ],
  };
}

/** Daftar sederhana dengan baris tetap. */
function staticList(
  description: string,
  columns: Column[],
  cells: Array<Record<string, string | number | null>>,
  options: Partial<DatasetSpec> = {},
): DatasetSpec {
  return {
    description,
    columns,
    rows: cells.map((item, index) => row(`static-${index}-${String(item[columns[0]?.key ?? ''] ?? index)}`, null, item)),
    ...options,
  };
}

// ---------------------------------------------------------------- Household

function householdOrders(seed: string, variant: 'penjualan' | 'funnel' | 'database' | 'input' | 'admin'): DatasetSpec {
  const random = seeded(seed);
  const rows = customers.map((customer, index) => {
    const person = personById(customer.salesforceId) ?? null;
    const status = pickOne(random, ['IO', 'RE', 'PS', 'PS', 'PS', 'Batal']);
    const io = novDate(random);
    const day = Number(io.slice(-2));
    const re = status === 'IO' ? null : `2026-11-${String(Math.min(day + 1, 28)).padStart(2, '0')}`;
    const ps = status === 'PS' ? `2026-11-${String(Math.min(day + 3, 28)).padStart(2, '0')}` : null;
    return row(`${seed}-${customer.id}`, person, {
      nomor: `ORD-2611-${String(3001 + index).padStart(5, '0')}`,
      tanggal: io,
      pelanggan: customer.name,
      layanan: customer.serviceNo,
      alamat: customer.address,
      paket: customer.packageName,
      io,
      re,
      ps,
      status,
      salesforce: person?.name ?? '-',
    });
  }).sort((a, b) => String(b.cells.tanggal).localeCompare(String(a.cells.tanggal)));

  const statusCol: Column = {
    key: 'status',
    label: 'Status',
    kind: 'status',
    editable: true,
    required: true,
    options: ['IO', 'RE', 'PS', 'Batal'],
  };
  const base: Column[] = [
    { key: 'nomor', label: 'No. order', kind: 'id', editable: true, required: true },
    { key: 'tanggal', label: 'Tanggal', kind: 'date', editable: true, required: true },
    { key: 'pelanggan', label: 'Pelanggan', kind: 'text', editable: true, required: true },
    {
      key: 'paket',
      label: 'Paket',
      kind: 'status',
      editable: true,
      required: true,
      options: ['IndiHome 30 Mbps', 'IndiHome 50 Mbps', 'IndiHome 100 Mbps + TV'],
    },
  ];
  const stats = (scoped: DataRow[]): StatTile[] => {
    const ps = scoped.filter((item) => item.cells.status === 'PS').length;
    return [
      { label: 'Order', value: num(scoped.length), note: '1–15 Nov 2026' },
      { label: 'PS', value: num(ps) },
      { label: 'Konversi ke PS', value: `${pct(ps, scoped.length).toLocaleString('id-ID')}%` },
      { label: 'Batal', value: num(scoped.filter((item) => item.cells.status === 'Batal').length) },
    ];
  };
  const chart = (scoped: DataRow[]): ModuleDataset['chart'] => ({
    title: 'Order per status',
    unit: 'number',
    bars: ['IO', 'RE', 'PS', 'Batal'].map((label) => ({
      label,
      value: scoped.filter((item) => item.cells.status === label).length,
    })),
  });

  if (variant === 'funnel') {
    return {
      description: 'Riwayat status order. Arti IO, RE, dan PS mengikuti definisi perusahaan.',
      columns: [
        base[0] as Column,
        { key: 'pelanggan', label: 'Pelanggan', kind: 'text' },
        { key: 'io', label: 'Tanggal IO', kind: 'date' },
        { key: 're', label: 'Tanggal RE', kind: 'date' },
        { key: 'ps', label: 'Tanggal PS', kind: 'date' },
        statusCol,
        personCol(),
      ],
      rows,
      filters: ['status', 'salesforce'],
      editable: true,
      personUnits: ['household'],
      stats,
      chart,
    };
  }
  if (variant === 'database') {
    return {
      description: 'Data pelanggan. Nomor layanan disimpan sebagai teks supaya nol di depan tetap utuh.',
      columns: [
        { key: 'pelanggan', label: 'Pelanggan', kind: 'text', editable: true, required: true },
        { key: 'layanan', label: 'No. layanan', kind: 'id', editable: true, required: true },
        { key: 'alamat', label: 'Alamat', kind: 'longtext', editable: true, required: true },
        base[3] as Column,
        { key: 'ps', label: 'Tanggal pasang', kind: 'date', editable: true },
        personCol(),
        statusCol,
      ],
      rows,
      filters: ['paket', 'status', 'salesforce'],
      editable: true,
      personUnits: ['household'],
      stats,
    };
  }
  return {
    description:
      variant === 'input'
        ? 'Order baru dari salesforce. Salesforce bisa menambah order miliknya sendiri; Admin bisa mengubah dan menghapus.'
        : 'Order IndiHome dan statusnya.',
    columns: [...base, { key: 'alamat', label: 'Alamat', kind: 'longtext', editable: true, required: true }, statusCol, personCol()],
    rows,
    filters: ['status', 'paket', 'salesforce'],
    editable: true,
    ownerCreate: variant === 'input',
    personUnits: ['household'],
    stats,
    chart,
  };
}

function billing(seed: string): DatasetSpec {
  const random = seeded(seed);
  const rows = customers.map((customer) => {
    const person = personById(customer.salesforceId) ?? null;
    const amount = customer.packageName.includes('100') ? 525000 : customer.packageName.includes('50') ? 350000 : 280000;
    return row(`${seed}-${customer.id}`, person, {
      pelanggan: customer.name,
      layanan: customer.serviceNo,
      periode: 'Okt 2026',
      tagihan: amount,
      status: pickOne(random, ['Lunas', 'Lunas', 'Lunas', 'Belum bayar']),
      salesforce: person?.name ?? '-',
    });
  });
  return {
    description: 'Tagihan pelanggan per periode. Data per tanggal unggah terakhir.',
    columns: [
      { key: 'pelanggan', label: 'Pelanggan', kind: 'text' },
      { key: 'layanan', label: 'No. layanan', kind: 'id' },
      { key: 'periode', label: 'Periode', kind: 'text' },
      { key: 'tagihan', label: 'Tagihan', kind: 'rupiah' },
      { key: 'status', label: 'Status', kind: 'status', editable: true, required: true, options: ['Lunas', 'Belum bayar'] },
      personCol(),
    ],
    rows,
    filters: ['status', 'salesforce'],
    editable: true,
    personUnits: ['household'],
    stats: (scoped) => {
      const paid = scoped.filter((item) => item.cells.status === 'Lunas');
      return [
        { label: 'Total tagihan', value: rupiahShort(sumBy(scoped, 'tagihan')), note: 'Okt 2026' },
        { label: 'Terbayar', value: rupiahShort(sumBy(paid, 'tagihan')) },
        { label: 'Collection', value: `${pct(sumBy(paid, 'tagihan'), sumBy(scoped, 'tagihan')).toLocaleString('id-ID')}%` },
        { label: 'Belum bayar', value: `${scoped.length - paid.length} pelanggan` },
      ];
    },
  };
}

function clockIn(seed: string): DatasetSpec {
  const random = seeded(seed);
  const rows: DataRow[] = [];
  for (const person of salesforceOf('household')) {
    for (let day = 15; day >= 11; day--) {
      const late = random() > 0.8;
      const leave = random() > 0.93;
      rows.push(
        row(`${seed}-${person.id}-${day}`, person, {
          tanggal: `2026-11-${day}`,
          salesforce: person.name,
          masuk: leave ? null : late ? `08:${between(random, 16, 45)}` : `07:${between(random, 40, 59)}`,
          keluar: leave ? null : `16:${String(between(random, 0, 40)).padStart(2, '0')}`,
          lokasi: pickOne(random, ['Kantor Cirebon', 'Booth Pasar Contoh', 'Perum Griya Contoh']),
          status: leave ? 'Izin' : late ? 'Terlambat' : 'Hadir',
        }),
      );
    }
  }
  return {
    description: 'Kehadiran harian. Aturan jam masuk mengikuti ketentuan yang perlu disahkan.',
    columns: [
      { key: 'tanggal', label: 'Tanggal', kind: 'date' },
      personCol(),
      { key: 'masuk', label: 'Jam masuk', kind: 'time' },
      { key: 'keluar', label: 'Jam keluar', kind: 'time' },
      { key: 'lokasi', label: 'Lokasi', kind: 'text' },
      { key: 'status', label: 'Status', kind: 'status', editable: true, required: true, options: ['Hadir', 'Terlambat', 'Izin'] },
    ],
    rows,
    filters: ['status', 'salesforce'],
    editable: true,
    personUnits: ['household'],
    stats: (scoped) => [
      { label: 'Catatan', value: num(scoped.length), note: '11–15 Nov 2026' },
      { label: 'Hadir', value: num(scoped.filter((item) => item.cells.status === 'Hadir').length) },
      { label: 'Terlambat', value: num(scoped.filter((item) => item.cells.status === 'Terlambat').length) },
      { label: 'Izin', value: num(scoped.filter((item) => item.cells.status === 'Izin').length) },
    ],
  };
}

// ---------------------------------------------------------------- Program, DOA, D2C

function programParticipants(seed: string, program: string): DatasetSpec {
  const random = seeded(seed);
  const rows = outlets.slice(0, 16).map((outlet) => {
    const person = personById(outlet.salesforceId) ?? null;
    const target = pickOne(random, [50, 100, 150]);
    const real = between(random, 10, Math.round(target * 1.3));
    return row(`${seed}-${outlet.id}`, person, {
      outlet: outlet.name,
      tap: outlet.tap,
      program,
      target,
      capaian: real,
      persen: pct(real, target),
      status: real >= target ? 'Tercapai' : 'Berjalan',
      salesforce: person?.name ?? '-',
    });
  });
  return {
    description: `Peserta program ${program} dan pencapaiannya. Mekanisme resmi mengikuti aturan program.`,
    columns: [
      { key: 'outlet', label: 'Outlet', kind: 'text' },
      { key: 'tap', label: 'TAP', kind: 'status', options: ['TAP Kota Cirebon', 'TAP Sumber', 'TAP Kuningan'] },
      { key: 'program', label: 'Program', kind: 'text' },
      { key: 'target', label: 'Target', kind: 'number', editable: true, required: true },
      { key: 'capaian', label: 'Pencapaian', kind: 'number', editable: true, required: true },
      { key: 'persen', label: 'Capaian', kind: 'percent' },
      { key: 'status', label: 'Status', kind: 'status', options: ['Tercapai', 'Berjalan'] },
      personCol(),
    ],
    rows,
    filters: ['status', 'tap'],
    editable: true,
    personUnits: ['mobile'],
    stats: (scoped) => [
      { label: 'Peserta', value: num(scoped.length) },
      { label: 'Tercapai', value: num(scoped.filter((item) => item.cells.status === 'Tercapai').length) },
    ],
  };
}

function doaAllocation(seed: string): DatasetSpec {
  const random = seeded(seed);
  const rows = Array.from({ length: 16 }, (_, index) => {
    const outlet = pickOne(random, outlets);
    const person = personById(outlet.salesforceId) ?? null;
    const qty = pickOne(random, [10, 20, 25, 50]);
    const start = 6210000000 + index * 1000;
    return row(`${seed}-${index}`, person, {
      tanggal: novDate(random),
      outlet: outlet.name,
      produk: pickOne(random, ['Perdana Internet 15GB', 'Perdana Internet 30GB', 'Voucher Data 10GB']),
      awal: `0${start}`,
      akhir: `0${start + qty - 1}`,
      jumlah: qty,
      salesforce: person?.name ?? '-',
    });
  });
  return {
    description: 'Alokasi nomor seri (SN) ke outlet. SN disimpan sebagai teks supaya nol di depan tidak hilang.',
    columns: [
      { key: 'tanggal', label: 'Tanggal', kind: 'date', editable: true, required: true },
      { key: 'outlet', label: 'Outlet', kind: 'text', editable: true, required: true },
      { key: 'produk', label: 'Produk', kind: 'text', editable: true, required: true },
      { key: 'awal', label: 'SN awal', kind: 'id', editable: true, required: true },
      { key: 'akhir', label: 'SN akhir', kind: 'id', editable: true, required: true },
      { key: 'jumlah', label: 'Jumlah', kind: 'number', editable: true, required: true },
      personCol(),
    ],
    rows,
    filters: ['produk', 'salesforce'],
    editable: true,
    personUnits: ['mobile'],
    stats: (scoped) => [
      { label: 'Alokasi', value: num(scoped.length) },
      { label: 'SN teralokasi', value: num(sumBy(scoped, 'jumlah')) },
    ],
  };
}

function doaSerials(seed: string): DatasetSpec {
  const random = seeded(seed);
  const rows = Array.from({ length: 30 }, (_, index) => {
    const outlet = pickOne(random, outlets);
    const person = personById(outlet.salesforceId) ?? null;
    return row(`${seed}-${index}`, person, {
      sn: `0${6210004000 + index * 13}`,
      produk: pickOne(random, ['Perdana Internet 15GB', 'Perdana Internet 30GB']),
      outlet: outlet.name,
      status: pickOne(random, ['Teralokasi', 'Terjual', 'Terjual']),
      tanggal: novDate(random),
      salesforce: person?.name ?? '-',
    });
  });
  return {
    description: 'Daftar nomor seri dan posisinya.',
    columns: [
      { key: 'sn', label: 'SN', kind: 'id' },
      { key: 'produk', label: 'Produk', kind: 'text' },
      { key: 'outlet', label: 'Outlet', kind: 'text' },
      { key: 'status', label: 'Status', kind: 'status', options: ['Teralokasi', 'Terjual'] },
      { key: 'tanggal', label: 'Tanggal', kind: 'date' },
      personCol(),
    ],
    rows,
    filters: ['status', 'produk'],
    stats: (scoped) => [
      { label: 'SN', value: num(scoped.length) },
      { label: 'Terjual', value: num(scoped.filter((item) => item.cells.status === 'Terjual').length) },
    ],
  };
}

function doaStock(seed: string): DatasetSpec {
  const random = seeded(seed);
  const items = ['Perdana Internet 15GB', 'Perdana Internet 30GB', 'Perdana Nelpon', 'Voucher Data 10GB', 'Voucher Data 25GB'];
  return staticList(
    'Posisi stok gudang cluster. Data snapshot per tanggal unggah.',
    [
      { key: 'produk', label: 'Produk', kind: 'text' },
      { key: 'gudang', label: 'Gudang', kind: 'text' },
      { key: 'stok', label: 'Stok', kind: 'number', editable: true, required: true },
      { key: 'teralokasi', label: 'Teralokasi', kind: 'number', editable: true, required: true },
      { key: 'sisa', label: 'Sisa', kind: 'number' },
      { key: 'diperbarui', label: 'Diperbarui', kind: 'date' },
    ],
    items.map((item) => {
      const stock = between(random, 2000, 9000);
      const allocated = between(random, 500, stock);
      return { produk: item, gudang: 'Gudang Cirebon', stok: stock, teralokasi: allocated, sisa: stock - allocated, diperbarui: '2026-11-15' };
    }),
    {
      editable: true,
      stats: (scoped) => [{ label: 'Sisa stok', value: num(sumBy(scoped, 'sisa')) }],
      chart: (scoped) => ({
        title: 'Sisa stok per produk',
        unit: 'number',
        bars: scoped.map((item) => ({ label: String(item.cells.produk), value: Number(item.cells.sisa) })),
      }),
    },
  );
}

function d2cTargets(seed: string, kind: 'sekolah' | 'instansi'): DatasetSpec {
  const random = seeded(seed);
  const names =
    kind === 'sekolah'
      ? ['SMA Contoh 1', 'SMK Contoh 2', 'Kampus Contoh', 'SMA Contoh 3', 'Politeknik Contoh', 'MA Contoh']
      : ['Komunitas Ojek Contoh', 'Koperasi Contoh', 'Paguyuban Pedagang Contoh', 'Karang Taruna Contoh', 'Instansi Contoh'];
  const salesforce = salesforceOf('direct_sales');
  const rows = names.map((name, index) => {
    const person = pickOne(random, salesforce);
    return row(`${seed}-${index}`, person, {
      nama: name,
      jenis: kind === 'sekolah' ? (name.includes('Kampus') || name.includes('Politeknik') ? 'Kampus' : 'Sekolah') : 'Komunitas',
      pic: `PIC ${name.split(' ')[0]}`,
      kunjungan: novDate(random),
      penjualan: between(random, 5, 120),
      salesforce: person.name,
      status: pickOne(random, ['Aktif', 'Penjajakan', 'Aktif']),
    });
  });
  return {
    description: kind === 'sekolah' ? 'Sasaran penjualan langsung di sekolah dan kampus.' : 'Sasaran penjualan langsung di instansi dan komunitas.',
    columns: [
      { key: 'nama', label: 'Nama sasaran', kind: 'text', editable: true, required: true },
      { key: 'jenis', label: 'Jenis', kind: 'text', editable: true, required: true },
      { key: 'pic', label: 'PIC', kind: 'text', editable: true },
      { key: 'kunjungan', label: 'Kunjungan terakhir', kind: 'date', editable: true },
      { key: 'penjualan', label: 'Perdana terjual', kind: 'number', editable: true },
      personCol(),
      { key: 'status', label: 'Status', kind: 'status', editable: true, required: true, options: ['Aktif', 'Penjajakan', 'Tidak aktif'] },
    ],
    rows,
    filters: ['status'],
    editable: true,
    ownerCreate: true,
    personUnits: ['direct_sales'],
    stats: (scoped) => [
      { label: 'Sasaran', value: num(scoped.length) },
      { label: 'Perdana terjual', value: num(sumBy(scoped, 'penjualan')) },
    ],
  };
}

function d2cEvents(seed: string): DatasetSpec {
  const random = seeded(seed);
  const salesforce = salesforceOf('direct_sales');
  const events = ['Car Free Day Contoh', 'Bazar Kampus Contoh', 'Pameran Mall Contoh', 'Festival Kuliner Contoh', 'Jalan Sehat Contoh'];
  const rows = events.map((name, index) => {
    const person = pickOne(random, salesforce);
    return row(`${seed}-${index}`, person, {
      foto: visitArt(name, `${seed}-${index}`),
      acara: name,
      tanggal: anyDate(random),
      lokasi: pickOne(random, ['Kota Cirebon', 'Sumber', 'Kuningan']),
      terjual: between(random, 20, 180),
      salesforce: person.name,
      status: pickOne(random, ['Selesai', 'Terjadwal']),
    });
  });
  return {
    description: 'Event dan dealing penjualan langsung.',
    columns: [
      { key: 'foto', label: 'Foto', kind: 'image', editable: true },
      { key: 'acara', label: 'Event', kind: 'text', editable: true, required: true },
      { key: 'tanggal', label: 'Tanggal', kind: 'date', editable: true, required: true },
      { key: 'lokasi', label: 'Lokasi', kind: 'text', editable: true, required: true },
      { key: 'terjual', label: 'Perdana terjual', kind: 'number', editable: true },
      personCol(),
      { key: 'status', label: 'Status', kind: 'status', editable: true, required: true, options: ['Terjadwal', 'Selesai', 'Batal'] },
    ],
    rows,
    filters: ['status'],
    editable: true,
    ownerCreate: true,
    personUnits: ['direct_sales'],
    stats: (scoped) => [
      { label: 'Event', value: num(scoped.length) },
      { label: 'Perdana terjual', value: num(sumBy(scoped, 'terjual')) },
    ],
  };
}

// ---------------------------------------------------------------- Admin operasional

const vacancyRows = [
  { judul: 'Salesforce Mobile', unit: 'Mobile', lokasi: 'Kota Cirebon', jenis: 'Kontrak', ditutup: '2026-12-15', pelamar: 18, status: 'Dibuka' },
  { judul: 'Sales IndiHome', unit: 'Household', lokasi: 'Kabupaten Kuningan', jenis: 'Kontrak', ditutup: '2026-12-20', pelamar: 11, status: 'Dibuka' },
  { judul: 'Admin Data', unit: 'Support', lokasi: 'Kota Cirebon', jenis: 'Penuh waktu', ditutup: '2026-12-31', pelamar: 27, status: 'Dibuka' },
  { judul: 'Supervisor Direct Sales', unit: 'Direct Sales', lokasi: 'Kabupaten Cirebon', jenis: 'Penuh waktu', ditutup: '2026-10-31', pelamar: 9, status: 'Ditutup' },
];

const applicantNames = [
  'Ahmad Fauzi', 'Bella Safitri', 'Candra Wijaya', 'Dina Marlina', 'Eka Putra', 'Fani Oktaviani',
  'Gita Ramadhani', 'Hadi Susanto', 'Intan Permatasari', 'Jefri Kurniawan',
];

function applications(seed: string): DatasetSpec {
  const random = seeded(seed);
  const rows = applicantNames.map((name, index) =>
    row(`${seed}-${index}`, null, {
      cv: documentArt(`CV ${name}.pdf`),
      pelamar: name,
      posisi: pickOne(random, vacancyRows.slice(0, 3).map((item) => item.judul)),
      tanggal: novDate(random),
      hp: `0812000010${String(index).padStart(2, '0')}`,
      status: pickOne(random, ['Baru', 'Seleksi berkas', 'Wawancara', 'Diterima', 'Ditolak']),
    }),
  );
  return {
    description: 'Lamaran masuk. CV berkas privat: hanya petugas dengan izin rekrutmen yang bisa membukanya.',
    columns: [
      { key: 'cv', label: 'CV', kind: 'image' },
      { key: 'pelamar', label: 'Pelamar', kind: 'text' },
      { key: 'posisi', label: 'Posisi', kind: 'status', options: vacancyRows.map((item) => item.judul) },
      { key: 'tanggal', label: 'Tanggal', kind: 'date' },
      { key: 'hp', label: 'Nomor HP', kind: 'id' },
      {
        key: 'status',
        label: 'Status',
        kind: 'status',
        editable: true,
        required: true,
        options: ['Baru', 'Seleksi berkas', 'Wawancara', 'Diterima', 'Ditolak'],
      },
    ],
    rows,
    filters: ['posisi', 'status'],
    editable: true,
    stats: (scoped) => [
      { label: 'Lamaran', value: num(scoped.length) },
      { label: 'Baru', value: num(scoped.filter((item) => item.cells.status === 'Baru').length) },
      { label: 'Wawancara', value: num(scoped.filter((item) => item.cells.status === 'Wawancara').length) },
    ],
  };
}

const customerCatalog: Array<[string, string, string, number | null]> = [
  ['Perdana Internet 15GB', 'Perdana', 'perdana', 35000],
  ['Perdana Internet 30GB', 'Perdana', 'perdana', 60000],
  ['Perdana Nelpon Sepuasnya', 'Perdana', 'perdana', null],
  ['Voucher Data 10GB', 'Voucher', 'voucher', 30000],
  ['Voucher Data 25GB', 'Voucher', 'voucher', 55000],
  ['Modem Orbit 4G', 'Orbit', 'orbit', 599000],
  ['Modem Orbit Pro', 'Orbit', 'orbit', null],
  ['Soundbox QRIS', 'Soundbox', 'soundbox', 249000],
];

function catalogProducts(seed: string, channel: 'pelanggan' | 'outlet'): DatasetSpec {
  const rows = customerCatalog.map(([name, category, art, price], index) =>
    row(`${seed}-${index}`, null, {
      gambar: productArt(art as 'perdana', name, `${channel}-${name}`),
      nama: channel === 'outlet' ? `Paket ${name}` : name,
      kategori: category,
      isi: channel === 'outlet' ? `${pickOne(seeded(name), [10, 20, 25, 50])} unit per paket` : null,
      harga: price === null ? null : channel === 'outlet' ? Math.round(price * 0.88) * 10 : price,
      status: price === null ? 'Draft' : 'Terbit',
    }),
  );
  return {
    description:
      channel === 'pelanggan'
        ? 'Produk ABKShop Pelanggan. Harga dan status di sini terpisah dari ABKShop Outlet.'
        : 'Paket ABKShop Outlet. Halaman pemesanan disematkan dari alamat yang diatur Admin Web.',
    columns: [
      { key: 'gambar', label: 'Gambar', kind: 'image', editable: true },
      { key: 'nama', label: channel === 'outlet' ? 'Paket' : 'Produk', kind: 'text', editable: true, required: true },
      { key: 'kategori', label: 'Kategori', kind: 'status', editable: true, required: true, options: ['Perdana', 'Voucher', 'Orbit', 'Soundbox'] },
      ...(channel === 'outlet' ? [{ key: 'isi', label: 'Isi paket', kind: 'text', editable: true, required: true } satisfies Column] : []),
      { key: 'harga', label: 'Harga', kind: 'rupiah', editable: true },
      { key: 'status', label: 'Status', kind: 'status', editable: true, required: true, options: ['Terbit', 'Draft', 'Diarsipkan'] },
    ],
    rows,
    filters: ['kategori', 'status'],
    editable: true,
    stats: (scoped) => [
      { label: channel === 'outlet' ? 'Paket' : 'Produk', value: num(scoped.length) },
      { label: 'Terbit', value: num(scoped.filter((item) => item.cells.status === 'Terbit').length) },
      { label: 'Draft', value: num(scoped.filter((item) => item.cells.status === 'Draft').length) },
    ],
  };
}

function programsAdmin(seed: string, audience: string): DatasetSpec {
  const random = seeded(seed);
  const titles: Record<string, string[]> = {
    Pelanggan: ['Bonus Kuota untuk Perdana Baru', 'Diskon Biaya Pasang IndiHome', 'Undian Isi Ulang Akhir Tahun'],
    Outlet: ['Target Perdana November', 'Undian Voucher Akhir Tahun', 'Outlet Rapi dengan Materi Promosi'],
    Internal: ['Kompetisi Salesforce Terbaik', 'Insentif Kunjungan Outlet'],
  };
  const rows = (titles[audience] ?? []).map((title, index) =>
    row(`${seed}-${index}`, null, {
      gambar: programArt(`${seed}-${title}`, pickOne(random, ['red', 'gold', 'ink'] as const)),
      judul: title,
      audiens: audience,
      mulai: `2026-${pickOne(random, ['10', '11', '12'])}-01`,
      selesai: `2026-${pickOne(random, ['11', '12'])}-30`,
      status: pickOne(random, ['Terbit', 'Terbit', 'Draft']),
    }),
  );
  return {
    description: `Program untuk audiens ${audience.toLowerCase()}. Syarat dan benefit milik Admin program, bukan Admin Web.`,
    columns: [
      { key: 'gambar', label: 'Gambar', kind: 'image', editable: true },
      { key: 'judul', label: 'Judul', kind: 'text', editable: true, required: true },
      { key: 'audiens', label: 'Audiens', kind: 'status', editable: true, required: true, options: ['Pelanggan', 'Outlet', 'Internal'] },
      { key: 'mulai', label: 'Mulai', kind: 'date', editable: true, required: true },
      { key: 'selesai', label: 'Selesai', kind: 'date', editable: true, required: true },
      { key: 'status', label: 'Status', kind: 'status', editable: true, required: true, options: ['Terbit', 'Draft', 'Diarsipkan'] },
    ],
    rows,
    filters: ['status'],
    editable: true,
    stats: (scoped) => [
      { label: 'Program', value: num(scoped.length) },
      { label: 'Terbit', value: num(scoped.filter((item) => item.cells.status === 'Terbit').length) },
    ],
  };
}

function digiposRegistrations(seed: string, variant: 'pendaftaran' | 'verifikasi' | 'status'): DatasetSpec {
  const random = seeded(seed);
  const names = ['Cell Harapan Baru', 'Toko Pulsa Mandiri', 'Mekar Cell', 'Sejahtera Phone', 'Amanah Cell', 'Bunda Pulsa', 'Cemerlang Cell', 'Dua Putra Ponsel'];
  const rows = names.map((name, index) =>
    row(`${seed}-${index}`, null, {
      foto: storeArt(name, `${seed}-${index}`),
      referensi: `DGP-2611${String(index + 2).padStart(2, '0')}-${String(1000 + index * 37)}`,
      outlet: name,
      pemilik: pickOne(random, ['Usep Saepulloh', 'Rina Rahayu', 'Dadang Sudrajat', 'Ela Nurlaela', 'Tono Sugiarto']),
      hp: `0813000020${String(index).padStart(2, '0')}`,
      tanggal: novDate(random),
      petugas: pickOne(random, ['Rizky Pratama', 'Dimas Saputra', 'Ilham Ramadhan']),
      status: pickOne(random, ['Baru', 'Verifikasi', 'Disetujui', 'Ditolak']),
    }),
  );
  const columns: Column[] =
    variant === 'verifikasi'
      ? [
          { key: 'foto', label: 'Foto toko', kind: 'image' },
          { key: 'outlet', label: 'Outlet', kind: 'text' },
          { key: 'petugas', label: 'Petugas', kind: 'text', editable: true, required: true },
          { key: 'tanggal', label: 'Tanggal kunjungan', kind: 'date', editable: true },
          { key: 'status', label: 'Hasil', kind: 'status', editable: true, required: true, options: ['Baru', 'Verifikasi', 'Disetujui', 'Ditolak'] },
        ]
      : [
          { key: 'referensi', label: 'No. referensi', kind: 'id' },
          { key: 'outlet', label: 'Outlet', kind: 'text' },
          { key: 'pemilik', label: 'Pemilik', kind: 'text' },
          { key: 'hp', label: 'Nomor HP', kind: 'id' },
          { key: 'tanggal', label: 'Tanggal daftar', kind: 'date' },
          { key: 'status', label: 'Status', kind: 'status', editable: true, required: true, options: ['Baru', 'Verifikasi', 'Disetujui', 'Ditolak'] },
        ];
  return {
    description:
      variant === 'verifikasi'
        ? 'Hasil verifikasi kunjungan ke calon mitra Digipos.'
        : 'Pendaftaran dari form Daftar Digipos di website Publik. Akun Digipos tidak aktif otomatis.',
    columns,
    rows,
    filters: ['status'],
    editable: true,
    stats: (scoped) => [
      { label: 'Pendaftar', value: num(scoped.length) },
      { label: 'Baru', value: num(scoped.filter((item) => item.cells.status === 'Baru').length) },
      { label: 'Disetujui', value: num(scoped.filter((item) => item.cells.status === 'Disetujui').length) },
    ],
  };
}

function leads(seed: string): DatasetSpec {
  const random = seeded(seed);
  const rows = customers.slice(0, 12).map((customer, index) => {
    const person = personById(customer.salesforceId) ?? null;
    return row(`${seed}-${index}`, person, {
      nama: customer.name,
      hp: `0857000030${String(index).padStart(2, '0')}`,
      alamat: customer.address,
      sumber: pickOne(random, ['Website', 'Website', 'Booth', 'Door to door']),
      tanggal: novDate(random),
      salesforce: person?.name ?? '-',
      status: pickOne(random, ['Baru', 'Dihubungi', 'Survei', 'Jadi order', 'Tidak tercakup']),
    });
  });
  return {
    description: 'Minat pemasangan dari website dan lapangan.',
    columns: [
      { key: 'nama', label: 'Nama', kind: 'text', editable: true, required: true },
      { key: 'hp', label: 'Nomor HP', kind: 'id', editable: true, required: true },
      { key: 'alamat', label: 'Alamat', kind: 'longtext', editable: true, required: true },
      { key: 'sumber', label: 'Sumber', kind: 'status', editable: true, required: true, options: ['Website', 'Booth', 'Door to door'] },
      { key: 'tanggal', label: 'Tanggal', kind: 'date', editable: true, required: true },
      personCol('Ditugaskan ke'),
      { key: 'status', label: 'Status', kind: 'status', editable: true, required: true, options: ['Baru', 'Dihubungi', 'Survei', 'Jadi order', 'Tidak tercakup'] },
    ],
    rows,
    filters: ['status', 'sumber'],
    editable: true,
    personUnits: ['household'],
    stats: (scoped) => [
      { label: 'Lead', value: num(scoped.length) },
      { label: 'Jadi order', value: num(scoped.filter((item) => item.cells.status === 'Jadi order').length) },
    ],
  };
}

// ---------------------------------------------------------------- daftar menu -> dataset

const mobileUpload: UploadSpec = {
  columns: ['id_digipos', 'tanggal', 'produk', 'jumlah', 'nilai'],
  numericColumns: ['jumlah', 'nilai'],
  requiredColumns: ['id_digipos', 'tanggal', 'produk', 'jumlah'],
  sample:
    'id_digipos,tanggal,produk,jumlah,nilai\nCONTOH001,2026-11-15,Perdana Internet 15GB,20,700000\nCONTOH002,2026-11-15,Voucher Data 10GB,15,450000\nCONTOH003,2026-11-15,Perdana Internet 30GB,,600000\n007123,2026-11-15,Voucher Data 25GB,10,550000\nCONTOH005,2026-11-15,Voucher Data 10GB,dua,60000',
};

const householdUpload: UploadSpec = {
  columns: ['no_order', 'no_layanan', 'pelanggan', 'paket', 'status', 'tanggal'],
  numericColumns: [],
  requiredColumns: ['no_order', 'no_layanan', 'status'],
  sample:
    'no_order,no_layanan,pelanggan,paket,status,tanggal\nORD-2611-04001,012200310000,Andi Kurniawan,IndiHome 30 Mbps,PS,2026-11-15\nORD-2611-04002,012200310137,Budi Santoso,IndiHome 50 Mbps,RE,2026-11-15\n,012200310274,Citra Lestari,IndiHome 30 Mbps,IO,2026-11-15',
};

const performanceMetrics: Record<string, [string, MetricOptions['valueKind'], [number, number]]> = {
  topline: ['TopLine (revenue)', 'rupiah', [40_000_000, 120_000_000]],
  '5s-4r': ['5s-4r', 'number', [60, 100]],
  'market-share': ['Market Share', 'number', [30, 60]],
  aktifasi: ['Aktifasi perdana', 'number', [150, 400]],
  sellout: ['Sellout', 'number', [200, 600]],
  'inject-voucher-fisik': ['Inject voucher fisik', 'number', [300, 900]],
  'redeem-voucher-fisik': ['Redeem voucher fisik', 'number', [250, 800]],
  'so-barcode-perdana': ['SO barcode perdana', 'number', [100, 300]],
  'so-barcode-voucher': ['SO barcode voucher', 'number', [150, 500]],
};

const mobileProducts: Array<[string, number]> = [
  ['Perdana Internet 15GB', 30000],
  ['Perdana Internet 30GB', 53000],
  ['Voucher Data 10GB', 27000],
  ['Voucher Data 25GB', 50500],
];

function buildRegistry(): Record<string, () => DatasetSpec> {
  const reg: Record<string, () => DatasetSpec> = {};
  const t = '/telkomsel';
  const h = '/indihome';
  const a = '/admin';

  // Telkomsel
  reg[`${t}/dashboard`] = () =>
    metricPerSalesforce('t-dash', {
      unit: 'mobile',
      description: 'Ringkasan sellthru terhadap target per salesforce, bulan berjalan.',
      valueKind: 'rupiah',
      target: [40_000_000, 90_000_000],
      chartTitle: 'Capaian sellthru per salesforce',
    });
  reg[`${t}/laporan-looker`] = () =>
    staticList(
      'Laporan Looker yang boleh dibuka sesuai izin. Tautan asli diisi setelah laporan dan izinnya dikonfirmasi.',
      [
        { key: 'nama', label: 'Laporan', kind: 'text' },
        { key: 'unit', label: 'Unit', kind: 'text' },
        { key: 'diperbarui', label: 'Diperbarui', kind: 'date' },
        { key: 'status', label: 'Tautan', kind: 'status', options: ['Belum diatur'] },
      ],
      [
        { nama: 'Sellthru harian cluster', unit: 'Mobile', diperbarui: '2026-11-15', status: 'Belum diatur' },
        { nama: 'Aktivasi perdana per TAP', unit: 'Mobile', diperbarui: '2026-11-14', status: 'Belum diatur' },
        { nama: 'Market share per kecamatan', unit: 'Mobile', diperbarui: '2026-11-10', status: 'Belum diatur' },
      ],
    );
  reg[`${t}/outlet/register-outlet`] = () => outletRegister('t-outlet', 'Master outlet beserta penugasan salesforce.');
  reg[`${t}/outlet/stock-perdana`] = () => outletStock('t-stock-p', 'Posisi stok perdana di outlet.', 'Perdana');
  reg[`${t}/outlet/stock-voucher`] = () => outletStock('t-stock-v', 'Posisi stok voucher fisik di outlet.', 'Voucher fisik');
  reg[`${t}/outlet/omzet-outlet`] = () => outletOmzet('t-omzet');
  for (const [slug, label, target] of [
    ['perdana', 'perdana', [120, 300]],
    ['voucher-fisik', 'voucher fisik', [300, 800]],
    ['cvm', 'CVM', [50, 150]],
    ['material-pop', 'materi POP', [10, 40]],
  ] as const) {
    reg[`${t}/sales-plan/${slug}`] = () =>
      metricPerSalesforce(`t-sp-${slug}`, {
        unit: 'mobile',
        description: `Rencana dan realisasi ${label} per salesforce.`,
        valueKind: 'number',
        target: [target[0], target[1]],
      });
  }
  reg[`${t}/sellthru/st-nota`] = () =>
    transactions('t-st-nota', { unit: 'mobile', description: 'Penjualan ke outlet berdasarkan nota.', products: mobileProducts, count: 36, prefix: 'NOTA' });
  reg[`${t}/sellthru/st-digipos`] = () =>
    transactions('t-st-dgp', { unit: 'mobile', description: 'Penjualan ke outlet lewat Digipos.', products: mobileProducts, count: 40, prefix: 'DGP' });
  reg[`${t}/sellthru/penjualan-d2c`] = () =>
    transactions('t-st-d2c', {
      unit: 'direct_sales',
      description: 'Penjualan langsung ke pelanggan oleh tim Direct Sales.',
      products: mobileProducts.slice(0, 2),
      count: 20,
      prefix: 'D2C',
      placeLabel: 'Lokasi',
      places: ['Car Free Day Contoh', 'Kampus Contoh', 'Pasar Contoh', 'Alun-alun Contoh'],
    });
  for (const [slug, [label, kind, target]] of Object.entries(performanceMetrics)) {
    reg[`${t}/performansi/${slug}`] = () =>
      metricPerSalesforce(`t-perf-${slug}`, {
        unit: 'mobile',
        description: `${label} per salesforce. Definisi, sumber, dan agregasi mengikuti kamus data yang disahkan.`,
        valueKind: kind,
        target,
      });
  }
  reg[`${t}/kpi/kpi-cluster`] = () =>
    staticList(
      'KPI cluster bulan berjalan. Bobot dan rumus skor contoh, bukan ketentuan resmi.',
      [
        { key: 'indikator', label: 'Indikator', kind: 'text' },
        { key: 'bobot', label: 'Bobot', kind: 'percent', editable: true, required: true },
        { key: 'target', label: 'Target', kind: 'number', editable: true, required: true },
        { key: 'realisasi', label: 'Realisasi', kind: 'number', editable: true, required: true },
        { key: 'capaian', label: 'Capaian', kind: 'percent' },
        { key: 'skor', label: 'Skor', kind: 'number' },
      ],
      [
        ['Aktivasi perdana', 30, 3200, 2810],
        ['Sellthru voucher', 25, 8400, 8650],
        ['Outlet aktif', 20, 480, 451],
        ['Inject voucher fisik', 15, 6000, 5130],
        ['Kunjungan outlet', 10, 2400, 2550],
      ].map((item) => {
        const [indikator, bobot, target, realisasi] = item as [string, number, number, number];
        const ach = pct(Number(realisasi), Number(target));
        return { indikator, bobot, target, realisasi, capaian: ach, skor: round1((Math.min(ach, 120) * Number(bobot)) / 100) };
      }),
      {
        editable: true,
        stats: (scoped) => [{ label: 'Total skor', value: round1(sumBy(scoped, 'skor')).toLocaleString('id-ID'), note: 'Skor maksimum contoh 120' }],
        chart: (scoped) => ({
          title: 'Capaian per indikator',
          unit: 'percent',
          bars: scoped.map((item) => ({ label: String(item.cells.indikator), value: Number(item.cells.capaian), target: 100 })),
        }),
      },
    );
  reg[`${t}/kpi/kpi-salesforce`] = () =>
    metricPerSalesforce('t-kpi-sf', {
      unit: 'mobile',
      description: 'Skor KPI per salesforce. Bobot dan rumus contoh.',
      valueKind: 'number',
      target: [80, 100],
      chartTitle: 'Skor KPI per salesforce',
    });
  reg[`${t}/program/scs`] = () => programParticipants('t-prog-scs', 'SCS');
  reg[`${t}/program/retina`] = () => programParticipants('t-prog-retina', 'Retina');
  reg[`${t}/program/dealing-misi`] = () => programParticipants('t-prog-misi', 'Dealing Misi');
  reg[`${t}/fee-komisi/management-fee`] = () => fees('t-fee-m', 'mobile', 'Management Fee');
  reg[`${t}/fee-komisi/marketing-fee`] = () => fees('t-fee-k', 'mobile', 'Marketing Fee');
  reg[`${t}/fee-komisi/gross-profit`] = () => fees('t-fee-g', 'mobile', 'Gross Profit');
  reg[`${t}/doa/alokasi`] = () => doaAllocation('t-doa-a');
  reg[`${t}/doa/list-sn`] = () => doaSerials('t-doa-sn');
  reg[`${t}/doa/stock`] = () => doaStock('t-doa-s');
  reg[`${t}/direct-to-customer/penjualan`] = () =>
    transactions('t-d2c-p', {
      unit: 'direct_sales',
      description: 'Penjualan langsung tim Direct Sales.',
      products: mobileProducts.slice(0, 2),
      count: 24,
      prefix: 'D2C',
      placeLabel: 'Lokasi',
      places: ['Car Free Day Contoh', 'Kampus Contoh', 'Pasar Contoh', 'Alun-alun Contoh'],
    });
  reg[`${t}/direct-to-customer/recharge`] = () =>
    transactions('t-d2c-r', {
      unit: 'direct_sales',
      description: 'Isi ulang yang dijual langsung tim Direct Sales.',
      products: [
        ['Isi ulang Rp25.000', 25000],
        ['Isi ulang Rp50.000', 50000],
        ['Isi ulang Rp100.000', 100000],
      ],
      count: 24,
      prefix: 'RCH',
      placeLabel: 'Lokasi',
      places: ['Car Free Day Contoh', 'Kampus Contoh', 'Pasar Contoh'],
    });
  reg[`${t}/direct-to-customer/event-dealing`] = () => d2cEvents('t-d2c-e');
  reg[`${t}/direct-to-customer/kpi`] = () =>
    metricPerSalesforce('t-d2c-kpi', {
      unit: 'direct_sales',
      description: 'Target dan realisasi penjualan langsung per salesforce.',
      valueKind: 'number',
      target: [150, 300],
    });
  reg[`${t}/direct-to-customer/sekolah-kampus`] = () => d2cTargets('t-d2c-s', 'sekolah');
  reg[`${t}/direct-to-customer/instansi-komunitas`] = () => d2cTargets('t-d2c-i', 'instansi');
  reg[`${t}/monitoring-pop`] = () =>
    photoLog('t-pop', {
      unit: 'mobile',
      kind: 'pop',
      count: 14,
      description: 'Penempatan dan kondisi materi promosi di outlet.',
      notes: ['Poster terpasang', 'Standee promo', 'Spanduk depan toko', 'Stiker etalase'],
    });
  reg[`${t}/komplain`] = () => tickets('t-komplain', 'mobile');
  reg[`${t}/dokumentasi/monitoring-visit`] = () =>
    photoLog('t-visit', {
      unit: 'mobile',
      kind: 'visit',
      count: 16,
      description: 'Foto kunjungan outlet oleh salesforce.',
      notes: ['Cek stok dan materi promosi', 'Penawaran program November', 'Kunjungan rutin', 'Edukasi aktivasi perdana'],
    });
  reg[`${t}/dokumentasi/dokumen`] = () =>
    photoLog('t-doc', {
      unit: 'mobile',
      kind: 'doc',
      count: 8,
      description: 'Dokumen kerja yang diunggah salesforce.',
      notes: ['Berita acara serah terima', 'Laporan mingguan', 'Surat pernyataan outlet'],
    });
  reg[`${t}/dokumentasi/video-roleplay`] = () =>
    photoLog('t-video', {
      unit: 'mobile',
      kind: 'video',
      count: 8,
      description: 'Video latihan penawaran produk.',
      notes: ['Roleplay penawaran perdana', 'Roleplay menangani keluhan', 'Roleplay program outlet'],
    });
  reg[`${t}/setting/target`] = () => targets('t-target', 'mobile');
  reg[`${t}/setting/upload-data`] = () => uploads('t-upload', 'Data Sellthru', mobileUpload);
  reg[`${t}/link-penting`] = () =>
    staticList(
      'Tautan kerja yang sering dipakai. Alamat asli diisi Admin.',
      [
        { key: 'judul', label: 'Judul', kind: 'text', editable: true, required: true },
        { key: 'kategori', label: 'Kategori', kind: 'status', editable: true, required: true, options: ['Aplikasi', 'Panduan', 'Formulir'] },
        { key: 'alamat', label: 'Alamat', kind: 'text', editable: true, required: true },
      ],
      [
        { judul: 'Aplikasi Digipos', kategori: 'Aplikasi', alamat: 'https://contoh.invalid/digipos' },
        { judul: 'Panduan program November', kategori: 'Panduan', alamat: 'https://contoh.invalid/panduan' },
        { judul: 'Form izin cuti', kategori: 'Formulir', alamat: 'https://contoh.invalid/cuti' },
      ],
      { editable: true, filters: ['kategori'] },
    );
  reg[`${t}/user-management`] = () => users('t-users', ['mobile', 'direct_sales']);

  // IndiHome
  reg[`${h}/dashboard`] = () =>
    metricPerSalesforce('h-dash', {
      unit: 'household',
      description: 'Order PS terhadap target per salesforce, bulan berjalan.',
      valueKind: 'number',
      target: [12, 30],
      chartTitle: 'Capaian PS per salesforce',
    });
  reg[`${h}/kpi`] = () =>
    metricPerSalesforce('h-kpi', {
      unit: 'household',
      description: 'Skor KPI salesforce Household. Bobot dan rumus contoh.',
      valueKind: 'number',
      target: [80, 100],
    });
  reg[`${h}/performance/penjualan`] = () => householdOrders('h-order', 'penjualan');
  reg[`${h}/performance/io-re-ps`] = () => householdOrders('h-order', 'funnel');
  reg[`${h}/ctb/tagihan`] = () => billing('h-ctb');
  reg[`${h}/user-management`] = () => users('h-users', ['household']);
  reg[`${h}/setting/target`] = () => targets('h-target', 'household');
  reg[`${h}/setting/upload-data-performance`] = () => uploads('h-upload', 'Data Performance', householdUpload);
  reg[`${h}/pop-material`] = () =>
    photoLog('h-pop', {
      unit: 'household',
      kind: 'pop',
      count: 10,
      description: 'Materi promosi IndiHome dan penempatannya.',
      notes: ['Spanduk perumahan', 'Brosur booth', 'Standee kantor desa'],
    });
  reg[`${h}/clock-in-mb`] = () => clockIn('h-clock');
  reg[`${h}/dokumentasi/door-to-door`] = () =>
    photoLog('h-d2d', {
      unit: 'household',
      kind: 'visit',
      count: 14,
      description: 'Kunjungan rumah ke rumah.',
      notes: ['Penawaran paket 30 Mbps', 'Survei calon pelanggan', 'Follow up minat dari website'],
    });
  reg[`${h}/dokumentasi/open-booth`] = () =>
    photoLog('h-booth', {
      unit: 'household',
      kind: 'booth',
      count: 8,
      description: 'Kegiatan booth IndiHome.',
      notes: ['Booth pasar pagi', 'Booth perumahan', 'Booth kantor kecamatan'],
    });
  reg[`${h}/dokumentasi/video-roleplay`] = () =>
    photoLog('h-video', {
      unit: 'household',
      kind: 'video',
      count: 6,
      description: 'Video latihan penawaran IndiHome.',
      notes: ['Roleplay penawaran paket', 'Roleplay menjawab keberatan harga'],
    });
  reg[`${h}/pelanggan/database`] = () => householdOrders('h-order', 'database');
  reg[`${h}/pelanggan/input-order`] = () => householdOrders('h-order', 'input');
  reg[`${h}/komplain-kendala`] = () => tickets('h-komplain', 'household');
  reg[`${h}/fee-komisi/management-fee`] = () => fees('h-fee-m', 'household', 'Management Fee');
  reg[`${h}/fee-komisi/marketing-fee`] = () => fees('h-fee-k', 'household', 'Marketing Fee');

  // Admin operasional
  reg[`${a}/kelola-karir/lowongan`] = () =>
    staticList(
      'Lowongan yang tampil di halaman Karir website Publik.',
      [
        { key: 'judul', label: 'Posisi', kind: 'text', editable: true, required: true },
        { key: 'unit', label: 'Unit', kind: 'status', editable: true, required: true, options: ['Mobile', 'Household', 'Direct Sales', 'Support'] },
        { key: 'lokasi', label: 'Lokasi', kind: 'text', editable: true, required: true },
        { key: 'jenis', label: 'Jenis', kind: 'status', editable: true, required: true, options: ['Kontrak', 'Penuh waktu'] },
        { key: 'ditutup', label: 'Ditutup', kind: 'date', editable: true, required: true },
        { key: 'pelamar', label: 'Pelamar', kind: 'number' },
        { key: 'status', label: 'Status', kind: 'status', editable: true, required: true, options: ['Dibuka', 'Ditutup', 'Draft'] },
      ],
      vacancyRows,
      { editable: true, filters: ['status', 'unit'], stats: (scoped) => [{ label: 'Lowongan dibuka', value: num(scoped.filter((item) => item.cells.status === 'Dibuka').length) }, { label: 'Total pelamar', value: num(sumBy(scoped, 'pelamar')) }] },
    );
  reg[`${a}/kelola-karir/lamaran`] = () => applications('a-lamaran');
  reg[`${a}/kelola-karir/status-tindak-lanjut`] = () =>
    staticList(
      'Jadwal tindak lanjut pelamar.',
      [
        { key: 'pelamar', label: 'Pelamar', kind: 'text', editable: true, required: true },
        { key: 'posisi', label: 'Posisi', kind: 'text', editable: true, required: true },
        { key: 'tahap', label: 'Tahap', kind: 'status', editable: true, required: true, options: ['Wawancara HR', 'Wawancara user', 'Tes lapangan', 'Penawaran kerja'] },
        { key: 'jadwal', label: 'Jadwal', kind: 'date', editable: true, required: true },
        { key: 'pic', label: 'PIC', kind: 'text', editable: true },
      ],
      [
        { pelamar: 'Candra Wijaya', posisi: 'Salesforce Mobile', tahap: 'Wawancara HR', jadwal: '2026-11-18', pic: 'Teguh Santoso' },
        { pelamar: 'Gita Ramadhani', posisi: 'Admin Data', tahap: 'Tes lapangan', jadwal: '2026-11-19', pic: 'Teguh Santoso' },
        { pelamar: 'Hadi Susanto', posisi: 'Sales IndiHome', tahap: 'Wawancara user', jadwal: '2026-11-20', pic: 'Eko Prasetyo' },
      ],
      { editable: true, filters: ['tahap'] },
    );
  reg[`${a}/kelola-karir/template-komunikasi`] = () =>
    staticList(
      'Template pesan ke pelamar. Belum ada pesan yang dikirim otomatis.',
      [
        { key: 'nama', label: 'Template', kind: 'text', editable: true, required: true },
        { key: 'kanal', label: 'Kanal', kind: 'status', editable: true, required: true, options: ['WhatsApp', 'Email'] },
        { key: 'isi', label: 'Isi', kind: 'longtext', editable: true, required: true },
      ],
      [
        { nama: 'Undangan wawancara', kanal: 'WhatsApp', isi: 'Halo {nama}, kami mengundang Anda wawancara pada {jadwal} di {lokasi}.' },
        { nama: 'Lamaran diterima', kanal: 'Email', isi: 'Terima kasih {nama}, lamaran Anda untuk {posisi} sudah kami terima.' },
      ],
      { editable: true },
    );
  reg[`${a}/abkshop-pelanggan/kategori`] = () =>
    staticList(
      'Kategori ABKShop Pelanggan.',
      [
        { key: 'kategori', label: 'Kategori', kind: 'text', editable: true, required: true },
        { key: 'produk', label: 'Jumlah produk', kind: 'number' },
        { key: 'status', label: 'Status', kind: 'status', editable: true, required: true, options: ['Terbit', 'Draft'] },
      ],
      [
        { kategori: 'Perdana', produk: 3, status: 'Terbit' },
        { kategori: 'Voucher', produk: 2, status: 'Terbit' },
        { kategori: 'Orbit', produk: 2, status: 'Terbit' },
        { kategori: 'Soundbox', produk: 1, status: 'Terbit' },
      ],
      { editable: true },
    );
  reg[`${a}/abkshop-pelanggan/produk`] = () => catalogProducts('a-cat-p', 'pelanggan');
  reg[`${a}/abkshop-pelanggan/harga`] = () =>
    staticList(
      'Riwayat perubahan harga ABKShop Pelanggan.',
      [
        { key: 'produk', label: 'Produk', kind: 'text', editable: true, required: true },
        { key: 'lama', label: 'Harga lama', kind: 'rupiah', editable: true },
        { key: 'baru', label: 'Harga baru', kind: 'rupiah', editable: true, required: true },
        { key: 'berlaku', label: 'Berlaku mulai', kind: 'date', editable: true, required: true },
        { key: 'status', label: 'Status', kind: 'status', editable: true, required: true, options: ['Terjadwal', 'Berlaku'] },
      ],
      [
        { produk: 'Perdana Internet 15GB', lama: 32000, baru: 35000, berlaku: '2026-11-01', status: 'Berlaku' },
        { produk: 'Voucher Data 25GB', lama: 52000, baru: 55000, berlaku: '2026-11-01', status: 'Berlaku' },
        { produk: 'Modem Orbit 4G', lama: 649000, baru: 599000, berlaku: '2026-12-01', status: 'Terjadwal' },
      ],
      { editable: true, filters: ['status'] },
    );
  reg[`${a}/abkshop-pelanggan/media-produk`] = () => catalogProducts('a-cat-media', 'pelanggan');
  reg[`${a}/abkshop-pelanggan/status-publikasi`] = () => catalogProducts('a-cat-status', 'pelanggan');
  reg[`${a}/abkshop-outlet/kategori`] = () => reg[`${a}/abkshop-pelanggan/kategori`]?.() as DatasetSpec;
  reg[`${a}/abkshop-outlet/paket`] = () => catalogProducts('a-cat-o', 'outlet');
  reg[`${a}/abkshop-outlet/harga-aturan-outlet`] = () =>
    staticList(
      'Aturan beli per paket outlet.',
      [
        { key: 'paket', label: 'Paket', kind: 'text', editable: true, required: true },
        { key: 'minimum', label: 'Minimum', kind: 'number', editable: true, required: true },
        { key: 'kelipatan', label: 'Kelipatan', kind: 'number', editable: true, required: true },
        { key: 'maksimum', label: 'Maksimum', kind: 'number', editable: true },
      ],
      [
        { paket: 'Paket Perdana Internet 15GB', minimum: 1, kelipatan: 1, maksimum: 50 },
        { paket: 'Paket Voucher Data 10GB', minimum: 2, kelipatan: 2, maksimum: null },
        { paket: 'Paket Modem Orbit 4G', minimum: 1, kelipatan: 1, maksimum: 5 },
      ],
      { editable: true },
    );
  reg[`${a}/abkshop-outlet/stok-snapshot`] = () => doaStock('a-stock');
  reg[`${a}/abkshop-outlet/order`] = () =>
    transactions('a-order-o', {
      unit: 'mobile',
      description: 'Order dari halaman pemesanan outlet. Status order dan pembayaran dipisah.',
      products: mobileProducts,
      count: 20,
      prefix: 'ORD',
    });
  reg[`${a}/abkshop-outlet/pemenuhan`] = () => doaAllocation('a-fulfil');
  reg[`${a}/indihome/paket-layanan`] = () =>
    staticList(
      'Paket IndiHome yang tampil di website Publik.',
      [
        { key: 'paket', label: 'Paket', kind: 'text', editable: true, required: true },
        { key: 'harga', label: 'Harga per bulan', kind: 'rupiah', editable: true },
        { key: 'isi', label: 'Isi', kind: 'longtext', editable: true },
        { key: 'status', label: 'Status', kind: 'status', editable: true, required: true, options: ['Terbit', 'Draft'] },
      ],
      [
        { paket: 'IndiHome 30 Mbps', harga: 280000, isi: 'Internet 30 Mbps, telepon rumah', status: 'Terbit' },
        { paket: 'IndiHome 50 Mbps', harga: 350000, isi: 'Internet 50 Mbps, telepon rumah', status: 'Terbit' },
        { paket: 'IndiHome 100 Mbps + TV', harga: null, isi: 'Internet 100 Mbps, TV interaktif', status: 'Terbit' },
      ],
      { editable: true },
    );
  reg[`${a}/indihome/faq-bisnis`] = () =>
    staticList(
      'Tanya-jawab di halaman IndiHome website Publik.',
      [
        { key: 'pertanyaan', label: 'Pertanyaan', kind: 'text', editable: true, required: true },
        { key: 'jawaban', label: 'Jawaban', kind: 'longtext', editable: true, required: true },
      ],
      [
        { pertanyaan: 'Berapa lama pemasangan setelah mendaftar?', jawaban: 'Petugas menghubungi dalam 1x24 jam untuk jadwal survei.' },
        { pertanyaan: 'Bagaimana tahu alamat sudah tercakup jaringan?', jawaban: 'Kirim form minat, petugas mengecek ketersediaan jaringan.' },
      ],
      { editable: true },
    );
  reg[`${a}/indihome/lead`] = () => leads('a-lead');
  reg[`${a}/indihome/database-pelanggan`] = () => householdOrders('h-order', 'database');
  reg[`${a}/indihome/input-order`] = () => householdOrders('h-order', 'input');
  reg[`${a}/indihome/status`] = () => householdOrders('h-order', 'funnel');
  reg[`${a}/promo-program/program-pelanggan`] = () => programsAdmin('a-prog-p', 'Pelanggan');
  reg[`${a}/promo-program/program-outlet`] = () => programsAdmin('a-prog-o', 'Outlet');
  reg[`${a}/promo-program/program-internal`] = () => programsAdmin('a-prog-i', 'Internal');
  reg[`${a}/promo-program/audiens`] = () =>
    staticList(
      'Audiens program dan website tempat program tampil.',
      [
        { key: 'audiens', label: 'Audiens', kind: 'text' },
        { key: 'tampil', label: 'Tampil di', kind: 'text' },
        { key: 'program', label: 'Program aktif', kind: 'number' },
      ],
      [
        { audiens: 'Pelanggan', tampil: 'Website Publik', program: 3 },
        { audiens: 'Outlet', tampil: 'Aplikasi Outlet', program: 3 },
        { audiens: 'Internal', tampil: 'Portal', program: 2 },
      ],
    );
  reg[`${a}/promo-program/periode`] = () => programsAdmin('a-prog-period', 'Outlet');
  reg[`${a}/promo-program/syarat`] = () =>
    staticList(
      'Syarat dan ketentuan per program.',
      [
        { key: 'program', label: 'Program', kind: 'text', editable: true, required: true },
        { key: 'syarat', label: 'Syarat', kind: 'longtext', editable: true, required: true },
      ],
      [
        { program: 'Target Perdana November', syarat: 'Penjualan dihitung dari aktivasi 1–30 November 2026.' },
        { program: 'Undian Voucher Akhir Tahun', syarat: 'Setiap pembelian 50 voucher fisik mendapat satu kupon.' },
      ],
      { editable: true },
    );
  reg[`${a}/promo-program/peserta-pencapaian`] = () => programParticipants('a-prog-peserta', 'Target Perdana November');
  reg[`${a}/daftar-digipos/informasi-syarat`] = () =>
    staticList(
      'Syarat pendaftaran yang tampil di halaman Daftar Digipos.',
      [{ key: 'syarat', label: 'Syarat', kind: 'text', editable: true, required: true }],
      [
        { syarat: 'Memiliki toko atau tempat usaha tetap.' },
        { syarat: 'KTP pemilik dan foto tampak depan toko.' },
        { syarat: 'Nomor HP aktif untuk akun Digipos.' },
      ],
      { editable: true },
    );
  reg[`${a}/daftar-digipos/form-field`] = () =>
    staticList(
      'Kolom form pendaftaran Digipos yang diizinkan.',
      [
        { key: 'kolom', label: 'Kolom', kind: 'text', editable: true, required: true },
        { key: 'jenis', label: 'Jenis isian', kind: 'status', editable: true, required: true, options: ['Teks', 'Nomor HP', 'Alamat', 'Foto'] },
        { key: 'wajib', label: 'Wajib', kind: 'status', editable: true, required: true, options: ['Ya', 'Tidak'] },
      ],
      [
        { kolom: 'Nama outlet', jenis: 'Teks', wajib: 'Ya' },
        { kolom: 'Nama pemilik', jenis: 'Teks', wajib: 'Ya' },
        { kolom: 'Nomor HP', jenis: 'Nomor HP', wajib: 'Ya' },
        { kolom: 'Alamat outlet', jenis: 'Alamat', wajib: 'Ya' },
      ],
      { editable: true },
    );
  reg[`${a}/daftar-digipos/pendaftaran`] = () => digiposRegistrations('a-dgp', 'pendaftaran');
  reg[`${a}/daftar-digipos/verifikasi`] = () => digiposRegistrations('a-dgp', 'verifikasi');
  reg[`${a}/daftar-digipos/status`] = () => digiposRegistrations('a-dgp', 'status');
  reg[`${a}/admin-input/outlet`] = () => outletRegister('a-outlet', 'Input dan ubah data outlet.');
  reg[`${a}/admin-input/poin-outlet`] = () =>
    staticList(
      'Poin outlet per periode. Aturan poin menunggu ketentuan resmi; angka ini contoh.',
      [
        { key: 'outlet', label: 'Outlet', kind: 'text' },
        { key: 'periode', label: 'Periode', kind: 'text' },
        { key: 'poin', label: 'Poin', kind: 'number', editable: true, required: true },
      ],
      outlets.slice(0, 10).map((outlet, index) => ({ outlet: outlet.name, periode: PERIOD, poin: 120 + index * 35 })),
      { editable: true },
    );
  reg[`${a}/admin-input/kalkulator-cuan`] = () => {
    const brands = [...new Set(mockCuanProducts.map((item) => item.brandName))];
    const categories = [...new Set(mockCuanProducts.map((item) => item.categoryName))];
    return staticList(
      'Produk Kalkulator Cuan di aplikasi Outlet. Untung per unit = harga jual - harga modal + cashback. Harga contoh, bukan harga resmi.',
      [
        { key: 'produk', label: 'Produk', kind: 'text', editable: true, required: true },
        { key: 'kategori', label: 'Kategori', kind: 'status', editable: true, required: true, options: categories },
        { key: 'brand', label: 'Brand', kind: 'status', editable: true, required: true, options: brands },
        { key: 'modal', label: 'Harga modal', kind: 'rupiah', editable: true, required: true },
        { key: 'jual', label: 'Harga jual', kind: 'rupiah', editable: true, required: true },
        { key: 'cashback', label: 'Cashback', kind: 'rupiah', editable: true, required: true },
        { key: 'untung', label: 'Untung per unit', kind: 'rupiah' },
        { key: 'unggulan', label: 'Unggulan', kind: 'status', editable: true, required: true, options: ['Ya', 'Tidak'] },
      ],
      mockCuanProducts.map((item) => ({
        produk: item.name,
        kategori: item.categoryName,
        brand: item.brandName,
        modal: item.capitalPrice,
        jual: item.sellingPrice,
        cashback: item.cashback,
        untung: item.sellingPrice - item.capitalPrice + item.cashback,
        unggulan: item.isHot ? 'Ya' : 'Tidak',
      })),
      {
        editable: true,
        filters: ['kategori', 'brand', 'unggulan'],
        stats: (scoped) => [
          { label: 'Produk', value: num(scoped.length) },
          { label: 'Unggulan', value: num(scoped.filter((item) => item.cells.unggulan === 'Ya').length) },
          { label: 'Brand', value: num(new Set(scoped.map((item) => item.cells.brand)).size) },
        ],
      },
    );
  };
  reg[`${a}/admin-input/upload-database`] = () => uploads('a-upload-db', 'Database Outlet', {
    columns: ['id_digipos', 'nama_outlet', 'pemilik', 'kecamatan', 'tap'],
    numericColumns: [],
    requiredColumns: ['id_digipos', 'nama_outlet', 'tap'],
    sample:
      'id_digipos,nama_outlet,pemilik,kecamatan,tap\nCONTOH025,Cell Baru Contoh,Pemilik Contoh,Kejaksan,TAP Kota Cirebon\n007891,Pulsa Contoh,Pemilik Contoh,Sumber,TAP Sumber\nCONTOH027,,Pemilik Contoh,Kuningan,TAP Kuningan',
  });
  reg[`${a}/admin-input/data-telkomsel-indihome`] = () => uploads('a-upload-mix', 'Data Telkomsel dan IndiHome', mobileUpload);
  reg[`${a}/pengaturan-operasional/target`] = () => targets('a-target', 'mobile');
  reg[`${a}/pengaturan-operasional/template-unggah`] = () =>
    staticList(
      'Template berkas unggahan per modul. Versi naik setiap kolom berubah.',
      [
        { key: 'template', label: 'Template', kind: 'text' },
        { key: 'kolom', label: 'Kolom', kind: 'longtext' },
        { key: 'versi', label: 'Versi', kind: 'number' },
      ],
      [
        { template: 'Data Sellthru', kolom: mobileUpload.columns.join(', '), versi: 2 },
        { template: 'Data Performance', kolom: householdUpload.columns.join(', '), versi: 1 },
        { template: 'Database Outlet', kolom: 'id_digipos, nama_outlet, pemilik, kecamatan, tap', versi: 1 },
      ],
    );
  reg[`${a}/pengaturan-operasional/master-wilayah-tim`] = () =>
    staticList(
      'Tim, unit, dan supervisornya.',
      [
        { key: 'tim', label: 'Tim', kind: 'text', editable: true, required: true },
        { key: 'unit', label: 'Unit', kind: 'status', editable: true, required: true, options: ['Mobile', 'Household', 'Direct Sales'] },
        { key: 'supervisor', label: 'Supervisor', kind: 'text', editable: true, required: true },
        { key: 'anggota', label: 'Salesforce', kind: 'number' },
      ],
      teams.map((team) => ({
        tim: team.name,
        unit: unitLabels[team.unit],
        supervisor: personById(team.supervisorId)?.name ?? '-',
        anggota: people.filter((person) => person.role === 'salesforce' && person.teamId === team.id).length,
      })),
      { editable: true, filters: ['unit'] },
    );
  reg[`${a}/pengaturan-operasional/kebijakan-order`] = () =>
    staticList(
      'Kebijakan order outlet yang disepakati. Nilai contoh.',
      [
        { key: 'aturan', label: 'Aturan', kind: 'text', editable: true, required: true },
        { key: 'nilai', label: 'Nilai', kind: 'text', editable: true, required: true },
      ],
      [
        { aturan: 'Batas waktu verifikasi order', nilai: '1x24 jam kerja' },
        { aturan: 'Pembayaran', nilai: 'Setelah barang diterima' },
        { aturan: 'Pembatalan oleh outlet', nilai: 'Sebelum status Diproses' },
      ],
      { editable: true },
    );
  reg[`${a}/user-management`] = () => users('a-users', ['mobile', 'household', 'direct_sales']);
  return reg;
}

export const datasetRegistry = buildRegistry();

/** Bar grafik dari dataset: dipakai Dashboard utama. */
export type { ChartBar };
