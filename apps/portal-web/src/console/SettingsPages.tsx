import {
  AsyncView,
  Button,
  DataNotice,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  StatusBadge,
  TableScroll,
  buttonClass,
  cardClass,
  cn,
  formatDateTime,
  tableClass,
  tdClass,
  thClass,
  useToast,
} from '@agrabudi/ui';
import { ArrowDown, ArrowUp, ExternalLink, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { appUrls } from '../app/env';
import {
  useAddAsset,
  useAssets,
  useAudit,
  useDeleteAsset,
  useLayouts,
  useNavigation,
  useSaveLayouts,
  useSaveNavigation,
} from './data/queries';
import type { LayoutSection, NavItem, SiteAsset } from './data/types';
import { siteLabel } from './labels';

function move<T>(items: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item as T);
  return next;
}

type Orderable = { id: string; label: string; visible: boolean; locked?: boolean };

/** Daftar yang bisa diurutkan dan disembunyikan. Disimpan sekaligus lewat tombol Simpan. */
function OrderList<T extends Orderable>({
  items,
  onChange,
  describe,
}: {
  items: T[];
  onChange: (next: T[]) => void;
  describe: (item: T) => string;
}) {
  return (
    <ol className={cn(cardClass, 'divide-y divide-surface-100')}>
      {items.map((item, index) => (
        <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
          <span className="w-6 text-sm text-ink-500 tabular-nums">{index + 1}</span>
          <span className="min-w-40 flex-1">
            <span className={cn('block font-semibold', !item.visible && 'text-ink-500 line-through')}>
              {item.label}
            </span>
            <span className="block text-xs text-ink-700">{describe(item)}</span>
          </span>
          {item.locked ? (
            <span className="inline-flex items-center gap-1 text-xs text-ink-700">
              <Lock aria-hidden className="size-3.5" />
              Menu modul, selalu tampil
            </span>
          ) : (
            <label className="inline-flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-5 accent-brand-red"
                checked={item.visible}
                onChange={(event) =>
                  onChange(items.map((entry) => (entry.id === item.id ? { ...entry, visible: event.target.checked } : entry)))
                }
              />
              Tampil
            </label>
          )}
          <span className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Naikkan ${item.label}`}
              disabled={index === 0}
              onClick={() => onChange(move(items, index, -1))}
              className="min-h-11 min-w-11"
            >
              <ArrowUp aria-hidden className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Turunkan ${item.label}`}
              disabled={index === items.length - 1}
              onClick={() => onChange(move(items, index, 1))}
              className="min-h-11 min-w-11"
            >
              <ArrowDown aria-hidden className="size-4" />
            </Button>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function NavigationPage() {
  const navigation = useNavigation();
  const save = useSaveNavigation();
  const toast = useToast();
  const [site, setSite] = useState<NavItem['site']>('public');
  const [draft, setDraft] = useState<NavItem[] | null>(null);
  useEffect(() => {
    if (navigation.data) setDraft(navigation.data.data);
  }, [navigation.data]);

  const items = (draft ?? []).filter((item) => item.site === site);
  const others = (draft ?? []).filter((item) => item.site !== site);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Navigasi"
        description="Urutan dan tampil-tidaknya menu utama tiap website. Menu milik modul bisnis selalu tampil."
        aside={navigation.data ? <DataNotice meta={navigation.data.meta} /> : null}
      />
      <div className="w-full tablet:w-56">
        <Field label="Website" htmlFor="nav-situs">
          <Select id="nav-situs" value={site} onChange={(event) => setSite(event.target.value as NavItem['site'])}>
            <option value="public">Publik</option>
            <option value="outlet">Outlet</option>
          </Select>
        </Field>
      </div>
      <AsyncView state={navigation} errorTitle="Navigasi tidak dapat dimuat" loadingLabel="Memuat navigasi">
        {() => (
          <OrderList
            items={items}
            onChange={(next) => setDraft([...others, ...next])}
            describe={(item) => item.href}
          />
        )}
      </AsyncView>
      <div>
        <Button
          disabled={!draft || save.isPending}
          onClick={() =>
            draft &&
            save.mutate(draft, { onSuccess: () => toast.show({ tone: 'success', message: 'Navigasi diterbitkan.' }) })
          }
        >
          Simpan dan terbitkan
        </Button>
      </div>
    </div>
  );
}

export function LayoutsPage() {
  const layouts = useLayouts();
  const save = useSaveLayouts();
  const toast = useToast();
  const [draft, setDraft] = useState<LayoutSection[] | null>(null);
  useEffect(() => {
    if (layouts.data) setDraft(layouts.data.data);
  }, [layouts.data]);
  const groups = [...new Set((draft ?? []).map((item) => item.page))];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Layout"
        description="Urutan bagian halaman dari komponen yang sudah disediakan. Tidak ada editor kode atau HTML bebas."
        aside={layouts.data ? <DataNotice meta={layouts.data.meta} /> : null}
      />
      <AsyncView state={layouts} errorTitle="Layout tidak dapat dimuat" loadingLabel="Memuat layout">
        {() => (
          <div className="flex flex-col gap-6">
            {groups.map((page) => {
              const items = (draft ?? []).filter((item) => item.page === page);
              return (
                <section key={page} aria-label={page} className="flex flex-col gap-2">
                  <h2 className="text-base font-bold">{page}</h2>
                  <OrderList
                    items={items}
                    describe={(item) => `Komponen: ${item.component}`}
                    onChange={(next) =>
                      setDraft((current) => [...(current ?? []).filter((item) => item.page !== page), ...next])
                    }
                  />
                </section>
              );
            })}
          </div>
        )}
      </AsyncView>
      <div>
        <Button
          disabled={!draft || save.isPending}
          onClick={() =>
            draft && save.mutate(draft, { onSuccess: () => toast.show({ tone: 'success', message: 'Layout diterbitkan.' }) })
          }
        >
          Simpan dan terbitkan
        </Button>
      </div>
    </div>
  );
}

const assetKindLabel: Record<SiteAsset['kind'], string> = {
  logo: 'Logo',
  foto: 'Foto',
  banner: 'Banner',
  ilustrasi: 'Ilustrasi',
};

export function AssetsPage() {
  const assets = useAssets();
  const add = useAddAsset();
  const remove = useDeleteAsset();
  const toast = useToast();
  const [kind, setKind] = useState<'all' | SiteAsset['kind']>('all');
  const [uploadKind, setUploadKind] = useState<SiteAsset['kind']>('foto');
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Aset Website"
        description="Logo resmi, foto kantor, gambar korporat, dan aset banner."
        aside={assets.data ? <DataNotice meta={assets.data.meta} /> : null}
      />
      <section aria-labelledby="unggah-aset" className={cn(cardClass, 'flex flex-col gap-4 p-5')}>
        <h2 id="unggah-aset" className="text-base font-bold">
          Unggah aset
        </h2>
        <div className="grid gap-4 tablet:grid-cols-[12rem_minmax(0,1fr)] tablet:items-end">
          <Field label="Jenis" htmlFor="aset-jenis">
            <Select id="aset-jenis" value={uploadKind} onChange={(event) => setUploadKind(event.target.value as SiteAsset['kind'])}>
              {Object.entries(assetKindLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Berkas gambar" htmlFor="aset-berkas" hint="JPG, PNG, WebP, atau SVG, maksimal 3 MB." error={error ?? undefined}>
            <Input
              id="aset-berkas"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className="py-2"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file) return;
                if (file.size > 3 * 1024 * 1024) {
                  setError('Ukuran berkas lebih dari 3 MB.');
                  return;
                }
                setError(null);
                const reader = new FileReader();
                reader.onload = () =>
                  add.mutate(
                    { name: file.name, kind: uploadKind, url: String(reader.result), sizeKb: Math.ceil(file.size / 1024) },
                    { onSuccess: () => toast.show({ tone: 'success', message: `${file.name} diunggah.` }) },
                  );
                reader.readAsDataURL(file);
              }}
            />
          </Field>
        </div>
      </section>
      <div className="w-full tablet:w-56">
        <Field label="Tampilkan" htmlFor="aset-filter">
          <Select id="aset-filter" value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}>
            <option value="all">Semua jenis</option>
            {Object.entries(assetKindLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <AsyncView state={assets} errorTitle="Aset tidak dapat dimuat" loadingLabel="Memuat aset">
        {(envelope) => {
          const list = envelope.data.filter((item) => kind === 'all' || item.kind === kind);
          return list.length === 0 ? (
            <EmptyState title="Belum ada aset" description="Unggah aset dari form di atas." />
          ) : (
            <ul className="grid grid-cols-2 gap-4 tablet:grid-cols-3 desktop:grid-cols-4">
              {list.map((asset) => (
                <li key={asset.id} className={cn(cardClass, 'flex flex-col overflow-hidden')}>
                  <div className="flex aspect-[4/3] items-center justify-center bg-surface-50 p-3">
                    <img src={asset.url} alt={asset.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3 text-sm">
                    <span className="font-semibold break-words">{asset.name}</span>
                    <span className="text-xs text-ink-700">
                      {assetKindLabel[asset.kind]}, {asset.sizeKb} KB
                    </span>
                    <span className="mt-auto flex gap-1 pt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          remove.mutate(asset.id, {
                            onSuccess: () => toast.show({ tone: 'success', message: `${asset.name} dihapus.` }),
                          })
                        }
                        disabled={asset.kind === 'logo'}
                      >
                        {asset.kind === 'logo' ? 'Logo resmi' : 'Hapus'}
                      </Button>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          );
        }}
      </AsyncView>
    </div>
  );
}

const widths = [
  { value: '360', label: 'Smartphone, 360 px' },
  { value: '768', label: 'Tablet, 768 px' },
  { value: '1440', label: 'Desktop, 1440 px' },
];

export function PreviewPage() {
  const [site, setSite] = useState<'public' | 'outlet'>('public');
  const [width, setWidth] = useState('360');
  const url = appUrls[site];
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Preview"
        description="Buka website di tab baru untuk mengecek tampilan sebelum dan sesudah terbit."
      />
      <div className="grid gap-4 tablet:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] tablet:items-end">
        <Field label="Website" htmlFor="preview-situs">
          <Select id="preview-situs" value={site} onChange={(event) => setSite(event.target.value as typeof site)}>
            <option value="public">Publik</option>
            <option value="outlet">Outlet</option>
          </Select>
        </Field>
        <Field label="Ukuran layar yang dicek" htmlFor="preview-layar">
          <Select id="preview-layar" value={width} onChange={(event) => setWidth(event.target.value)}>
            {widths.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>
        <a href={url} target="_blank" rel="noreferrer" className={buttonClass()}>
          Buka {siteLabel[site]}
          <ExternalLink aria-hidden className="size-4" />
        </a>
      </div>
      <p className="max-w-prose text-sm text-ink-700">
        Atur lebar jendela browser ke {width} px, atau pakai mode perangkat di browser, lalu periksa halaman yang
        diubah. Preview draft yang belum terbit aktif setelah CMS API tersedia, memakai sesi berizin dan tidak masuk
        cache publik.
      </p>
    </div>
  );
}

export function AuditPage() {
  const audit = useAudit();
  const [query, setQuery] = useState('');
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit Konten"
        description="Catatan perubahan konten website: siapa, apa, dan kapan. Data operasional tidak tercatat di sini."
        aside={audit.data ? <DataNotice meta={audit.data.meta} /> : null}
      />
      <div className="w-full tablet:w-72">
        <Field label="Cari catatan" htmlFor="audit-cari">
          <Input id="audit-cari" type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
        </Field>
      </div>
      <AsyncView state={audit} errorTitle="Audit tidak dapat dimuat" loadingLabel="Memuat audit">
        {(envelope) => {
          const keyword = query.trim().toLowerCase();
          const list = envelope.data.filter(
            (item) => !keyword || `${item.action} ${item.object} ${item.actor}`.toLowerCase().includes(keyword),
          );
          return list.length === 0 ? (
            <EmptyState title="Tidak ada catatan" description="Belum ada perubahan yang cocok." />
          ) : (
            <TableScroll label="Catatan audit" scrollHint="Geser tabel ke samping untuk melihat pelaku.">
              <table className={cn(tableClass, 'min-w-[40rem]')}>
                <thead>
                  <tr>
                    <th scope="col" className={thClass}>
                      Waktu
                    </th>
                    <th scope="col" className={thClass}>
                      Aksi
                    </th>
                    <th scope="col" className={thClass}>
                      Objek
                    </th>
                    <th scope="col" className={thClass}>
                      Pelaku
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((item) => (
                    <tr key={item.id}>
                      <td className={cn(tdClass, 'whitespace-nowrap')}>{formatDateTime(item.at)}</td>
                      <td className={tdClass}>
                        <StatusBadge tone={item.action.startsWith('Menghapus') ? 'danger' : item.action === 'Menerbitkan' ? 'success' : 'info'}>
                          {item.action}
                        </StatusBadge>
                      </td>
                      <td className={tdClass}>{item.object}</td>
                      <td className={cn(tdClass, 'text-ink-700')}>{item.actor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          );
        }}
      </AsyncView>
    </div>
  );
}
