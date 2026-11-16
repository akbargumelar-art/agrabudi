import {
  AsyncView,
  DataNotice,
  EmptyState,
  PageHeader,
  Select,
  TableScroll,
  formatDate,
  formatDateTime,
  tableClass,
  tdClass,
  thClass,
  useToast,
} from '@agrabudi/ui';
import type { ContentStatus } from '@agrabudi/contracts';
import { Link } from 'react-router';
import { useBanners, usePages, usePublications, useUpdatePageStatus } from './data/queries';
import { ContentStatusBadge, contentStatusLabel, objectTypeLabel, siteLabel } from './labels';


export function DashboardPage() {
  const pages = usePages();
  const banners = useBanners();
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dashboard Website"
        description="Status halaman perusahaan dan banner di tiga website."
        aside={pages.data ? <DataNotice meta={pages.data.meta} /> : null}
      />
      <div className="grid gap-8 desktop:grid-cols-2">
        <section aria-labelledby="ringkas-halaman">
          <h2 id="ringkas-halaman" className="text-base font-bold">
            Halaman yang belum terbit
          </h2>
          <div className="mt-3">
            <AsyncView
              state={pages}
              errorTitle="Halaman tidak dapat dimuat"
              loadingLabel="Memuat halaman"
            >
              {(envelope) => {
                const pending = envelope.data.filter(
                  (page) => page.status === 'draft' || page.status === 'review',
                );
                return pending.length === 0 ? (
                  <EmptyState title="Semua halaman sudah terbit" />
                ) : (
                  <ul className="divide-y divide-surface-100 border-y border-surface-100">
                    {pending.map((page) => (
                      <li
                        key={page.id}
                        className="flex min-h-12 flex-wrap items-center justify-between gap-2 py-2"
                      >
                        <span className="text-sm font-medium">{page.title}</span>
                        <ContentStatusBadge status={page.status} />
                      </li>
                    ))}
                  </ul>
                );
              }}
            </AsyncView>
          </div>
          <Link
            to="/web-admin/pages"
            className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-brand-red-strong underline"
          >
            Buka Halaman Perusahaan
          </Link>
        </section>
        <section aria-labelledby="ringkas-banner">
          <h2 id="ringkas-banner" className="text-base font-bold">
            Banner
          </h2>
          <div className="mt-3">
            <AsyncView
              state={banners}
              errorTitle="Banner tidak dapat dimuat"
              loadingLabel="Memuat banner"
            >
              {(envelope) =>
                envelope.data.length === 0 ? (
                  <EmptyState title="Belum ada banner" />
                ) : (
                  <ul className="divide-y divide-surface-100 border-y border-surface-100">
                    {envelope.data.map((banner) => (
                      <li
                        key={banner.id}
                        className="flex min-h-12 flex-wrap items-center justify-between gap-2 py-2"
                      >
                        <span className="text-sm font-medium">
                          {banner.title}
                          <span className="block text-xs font-normal text-ink-700">
                            {siteLabel[banner.site]}, sampai {formatDate(banner.endsAt)}
                          </span>
                        </span>
                        <ContentStatusBadge status={banner.status} />
                      </li>
                    ))}
                  </ul>
                )
              }
            </AsyncView>
          </div>
          <Link
            to="/web-admin/banners"
            className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-brand-red-strong underline"
          >
            Buka Banner
          </Link>
        </section>
      </div>
    </div>
  );
}

export function PagesPage() {
  const pages = usePages();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Halaman Perusahaan"
        description="Profil, Tentang Kami, area, kantor, kontak, dan informasi institusional lain."
        aside={pages.data ? <DataNotice meta={pages.data.meta} /> : null}
      />
      <AsyncView
        state={pages}
        errorTitle="Daftar halaman tidak dapat dimuat"
        loadingLabel="Memuat halaman"
      >
        {(envelope) =>
          envelope.data.length === 0 ? (
            <EmptyState
              title="Belum ada halaman"
              description="Halaman institusional yang Anda buat akan muncul di sini."
            />
          ) : (
            <TableScroll
              label="Daftar halaman perusahaan"
              scrollHint="Geser tabel ke samping untuk melihat status."
            >
              <table className={`${tableClass} min-w-[48rem]`}>
                <thead>
                  <tr>
                    <th scope="col" className={thClass}>
                      Judul
                    </th>
                    <th scope="col" className={thClass}>
                      Website
                    </th>
                    <th scope="col" className={thClass}>
                      Alamat
                    </th>
                    <th scope="col" className={thClass}>
                      Status
                    </th>
                    <th scope="col" className={thClass}>
                      Diperbarui
                    </th>
                    <th scope="col" className={thClass}>
                      Ubah status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {envelope.data.map((page) => (
                    <tr key={page.id}>
                      <th scope="row" className={`${tdClass} text-left font-semibold`}>
                        {page.title}
                      </th>
                      <td className={tdClass}>{siteLabel[page.site]}</td>
                      <td className={`${tdClass} text-ink-700`}>/{page.slug}</td>
                      <td className={tdClass}>
                        <ContentStatusBadge status={page.status} />
                      </td>
                      <td className={`${tdClass} whitespace-nowrap`}>
                        {formatDateTime(page.updatedAt)}
                      </td>
                      <td className={tdClass}>
                        <PageStatusSelect id={page.id} title={page.title} status={page.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )
        }
      </AsyncView>
      <p className="max-w-prose text-sm text-ink-700">
        Alur terbit: Draft, lalu Menunggu review, lalu Terbit. Setiap perubahan status tercatat di Audit
        Konten, dan setiap terbit tercatat di Riwayat Publikasi.
      </p>
    </div>
  );
}

function PageStatusSelect({ id, title, status }: { id: string; title: string; status: ContentStatus }) {
  const update = useUpdatePageStatus();
  const toast = useToast();
  return (
    <>
      <Select
        aria-label={`Ubah status ${title}`}
        value={status}
        disabled={update.isPending}
        onChange={(event) => {
          const next = event.target.value as ContentStatus;
          update.mutate(
            { id, status: next },
            { onSuccess: () => toast.show({ tone: 'success', message: `Status ${title} diubah.` }) },
          );
        }}
        className="min-w-44"
      >
        {Object.entries(contentStatusLabel).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
    </>
  );
}

export function PublicationsPage() {
  const publications = usePublications();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Riwayat Publikasi"
        description="Riwayat terbit konten website dan pemulihan ke versi sebelumnya."
        aside={publications.data ? <DataNotice meta={publications.data.meta} /> : null}
      />
      <AsyncView
        state={publications}
        errorTitle="Riwayat publikasi tidak dapat dimuat"
        loadingLabel="Memuat riwayat"
      >
        {(envelope) =>
          envelope.data.length === 0 ? (
            <EmptyState
              title="Belum ada publikasi"
              description="Setiap konten yang diterbitkan tercatat di sini."
            />
          ) : (
            <TableScroll
              label="Riwayat publikasi"
              scrollHint="Geser tabel ke samping untuk melihat waktu terbit."
            >
              <table className={`${tableClass} min-w-[36rem]`}>
                <thead>
                  <tr>
                    <th scope="col" className={thClass}>
                      Konten
                    </th>
                    <th scope="col" className={thClass}>
                      Jenis
                    </th>
                    <th scope="col" className={`${thClass} text-right`}>
                      Revisi
                    </th>
                    <th scope="col" className={thClass}>
                      Terbit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {envelope.data.map((record) => (
                    <tr key={record.id}>
                      <th scope="row" className={`${tdClass} text-left font-semibold`}>
                        {record.objectTitle}
                      </th>
                      <td className={tdClass}>{objectTypeLabel[record.objectType]}</td>
                      <td className={`${tdClass} text-right`}>{record.revision}</td>
                      <td className={`${tdClass} whitespace-nowrap`}>
                        {formatDateTime(record.publishedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )
        }
      </AsyncView>
      <p className="text-sm text-ink-700">Pemulihan ke versi sebelumnya aktif setelah CMS API tersedia.</p>
    </div>
  );
}
