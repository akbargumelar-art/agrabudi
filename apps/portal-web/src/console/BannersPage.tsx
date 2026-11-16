import { siteBannerSchema, type ContentStatus, type SiteBanner } from '@agrabudi/contracts';
import {
  AsyncView,
  Button,
  DataNotice,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  cardClass,
  cn,
  formatDate,
  useToast,
} from '@agrabudi/ui';
import { ImageOff, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useBanners, useDeleteBanner, useSaveBanner } from './data/queries';
import { ContentStatusBadge, contentStatusLabel, siteLabel } from './labels';

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const emptyBanner = (): SiteBanner => ({
  id: `banner-${Date.now()}`,
  site: 'public',
  page: 'home',
  slot: 'hero',
  title: '',
  subtitle: null,
  ctaLabel: null,
  ctaHref: null,
  imageUrl: null,
  startsAt: new Date().toISOString().slice(0, 10),
  endsAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  status: 'draft',
});

export function BannersPage() {
  const banners = useBanners();
  const [editing, setEditing] = useState<SiteBanner | null>(null);
  const [deleting, setDeleting] = useState<SiteBanner | null>(null);
  const [site, setSite] = useState<'all' | SiteBanner['site']>('all');
  const remove = useDeleteBanner();
  const toast = useToast();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Banner"
        description="Banner menurut website, halaman, slot, dan periode tayang."
        aside={banners.data ? <DataNotice meta={banners.data.meta} /> : null}
      />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-full tablet:w-56">
          <Field label="Website" htmlFor="filter-banner-situs">
            <Select id="filter-banner-situs" value={site} onChange={(event) => setSite(event.target.value as typeof site)}>
              <option value="all">Semua website</option>
              <option value="public">Publik</option>
              <option value="outlet">Outlet</option>
            </Select>
          </Field>
        </div>
        <Button onClick={() => setEditing(emptyBanner())}>
          <Plus aria-hidden className="size-4" />
          Tambah banner
        </Button>
      </div>
      <AsyncView state={banners} errorTitle="Daftar banner tidak dapat dimuat" loadingLabel="Memuat banner">
        {(envelope) => {
          const list = envelope.data.filter((item) => site === 'all' || item.site === site);
          return list.length === 0 ? (
            <EmptyState title="Belum ada banner" description="Tambah banner untuk website ini." />
          ) : (
            <ul className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
              {list.map((banner) => (
                <li key={banner.id} className={cn(cardClass, 'flex flex-col overflow-hidden')}>
                  <div className="relative aspect-[16/7] bg-surface-50">
                    {banner.imageUrl ? (
                      <img src={banner.imageUrl} alt="" className="absolute inset-0 size-full object-cover" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-ink-500">
                        <ImageOff aria-hidden className="size-5" />
                        Belum ada gambar
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <ContentStatusBadge status={banner.status} />
                      <span className="text-xs text-ink-700">
                        {siteLabel[banner.site]}, {banner.page}, slot {banner.slot}
                      </span>
                    </div>
                    <h2 className="font-bold">{banner.title}</h2>
                    {banner.subtitle ? <p className="text-sm text-ink-700">{banner.subtitle}</p> : null}
                    <p className="text-xs text-ink-700">
                      Tayang {formatDate(banner.startsAt)} sampai {formatDate(banner.endsAt)}
                      {banner.ctaLabel ? `. Tombol: ${banner.ctaLabel} (${banner.ctaHref})` : ''}
                    </p>
                    <div className="mt-auto flex gap-2 pt-2">
                      <Button size="sm" variant="secondary" onClick={() => setEditing(banner)}>
                        Ubah
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleting(banner)}>
                        Hapus
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          );
        }}
      </AsyncView>
      <p className="max-w-prose text-sm text-ink-700">
        Banner boleh menunjuk program atau produk, tetapi judul, harga, syarat, dan periodenya tetap diambil dari
        data milik Admin operasional. Di mode contoh, perubahan di sini tidak mengubah pratinjau website Publik.
      </p>

      {editing ? (
        <BannerForm
          banner={editing}
          isNew={!envelopeHas(banners.data?.data, editing.id)}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Hapus banner ini?"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeleting(null)}>
              Batal
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!deleting) return;
                remove.mutate(deleting.id, {
                  onSuccess: () => toast.show({ tone: 'success', message: 'Banner dihapus.' }),
                });
                setDeleting(null);
              }}
            >
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm">
          Banner <span className="font-semibold">{deleting?.title}</span> berhenti tayang dan hilang dari daftar.
        </p>
      </Modal>
    </div>
  );
}

function envelopeHas(list: SiteBanner[] | undefined, id: string) {
  return Boolean(list?.some((item) => item.id === id));
}

function BannerForm({ banner, isNew, onClose }: { banner: SiteBanner; isNew: boolean; onClose: () => void }) {
  const save = useSaveBanner();
  const toast = useToast();
  const [value, setValue] = useState<SiteBanner>(banner);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof SiteBanner>(key: K, next: SiteBanner[K]) {
    setValue((current) => ({ ...current, [key]: next }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!value.title.trim()) nextErrors.title = 'Judul wajib diisi.';
    if (value.endsAt < value.startsAt) nextErrors.endsAt = 'Tanggal selesai tidak boleh sebelum tanggal mulai.';
    if (Boolean(value.ctaLabel) !== Boolean(value.ctaHref)) {
      nextErrors.ctaHref = 'Isi teks tombol dan tujuannya, atau kosongkan keduanya.';
    } else if (value.ctaHref && !value.ctaHref.startsWith('/')) {
      nextErrors.ctaHref = 'Tujuan tombol berupa alamat di website yang sama, diawali "/".';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    const parsed = siteBannerSchema.parse({
      ...value,
      title: value.title.trim(),
      subtitle: value.subtitle?.trim() || null,
      ctaLabel: value.ctaLabel?.trim() || null,
      ctaHref: value.ctaHref?.trim() || null,
    });
    save.mutate(parsed, {
      onSuccess: () => {
        toast.show({ tone: 'success', message: isNew ? 'Banner ditambahkan.' : 'Banner disimpan.' });
        onClose();
      },
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? 'Tambah banner' : 'Ubah banner'}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Batal
          </Button>
          <Button size="sm" type="submit" form="form-banner" disabled={save.isPending}>
            Simpan
          </Button>
        </>
      }
    >
      <form id="form-banner" noValidate onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Gambar (opsional)" htmlFor="banner-gambar" hint="JPG, PNG, atau WebP, maksimal 3 MB." error={errors.image}>
          <div className="flex flex-col gap-2">
            {value.imageUrl ? (
              <img src={value.imageUrl} alt="" className="aspect-[16/7] w-full rounded-control border border-surface-100 object-cover" />
            ) : null}
            <Input
              id="banner-gambar"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="py-2"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (file.size > MAX_IMAGE_BYTES) {
                  setErrors((current) => ({ ...current, image: 'Ukuran gambar lebih dari 3 MB.' }));
                  return;
                }
                setErrors((current) => ({ ...current, image: '' }));
                const reader = new FileReader();
                reader.onload = () => set('imageUrl', String(reader.result));
                reader.readAsDataURL(file);
              }}
            />
          </div>
        </Field>
        <Field label="Judul" htmlFor="banner-judul" error={errors.title}>
          <Input id="banner-judul" value={value.title} onChange={(event) => set('title', event.target.value)} />
        </Field>
        <Field label="Keterangan (opsional)" htmlFor="banner-keterangan">
          <Input
            id="banner-keterangan"
            value={value.subtitle ?? ''}
            onChange={(event) => set('subtitle', event.target.value)}
          />
        </Field>
        <div className="grid gap-4 tablet:grid-cols-2">
          <Field label="Teks tombol (opsional)" htmlFor="banner-cta">
            <Input id="banner-cta" value={value.ctaLabel ?? ''} onChange={(event) => set('ctaLabel', event.target.value)} />
          </Field>
          <Field label="Tujuan tombol (opsional)" htmlFor="banner-tujuan" hint="Contoh: /produk" error={errors.ctaHref}>
            <Input id="banner-tujuan" value={value.ctaHref ?? ''} onChange={(event) => set('ctaHref', event.target.value)} />
          </Field>
        </div>
        <div className="grid gap-4 tablet:grid-cols-2">
          <Field label="Website" htmlFor="banner-situs">
            <Select
              id="banner-situs"
              value={value.site}
              onChange={(event) => {
                const site = event.target.value as SiteBanner['site'];
                setValue((current) => ({ ...current, site, slot: site === 'outlet' ? 'atas' : 'hero' }));
              }}
            >
              <option value="public">Publik</option>
              <option value="outlet">Outlet</option>
            </Select>
          </Field>
          <Field label="Status" htmlFor="banner-status">
            <Select id="banner-status" value={value.status} onChange={(event) => set('status', event.target.value as ContentStatus)}>
              {Object.entries(contentStatusLabel).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Mulai tayang" htmlFor="banner-mulai">
            <Input id="banner-mulai" type="date" value={value.startsAt} onChange={(event) => set('startsAt', event.target.value)} />
          </Field>
          <Field label="Selesai tayang" htmlFor="banner-selesai" error={errors.endsAt}>
            <Input id="banner-selesai" type="date" value={value.endsAt} onChange={(event) => set('endsAt', event.target.value)} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
