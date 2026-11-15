import {
  AsyncView,
  DataNotice,
  EmptyState,
  PageHeader,
  TableScroll,
  formatDate,
  formatDateTime,
  tableClass,
  tdClass,
  thClass,
} from '@agrabudi/ui';
import { Link } from 'react-router';
import { useBanners, usePages, usePublications } from '../data/queries';
import { ContentStatusBadge, objectTypeLabel, siteLabel } from './labels';

const EDITOR_NOTE =
  'Membuat dan mengubah isi belum aktif. Editor, preview, dan publikasi menyala setelah layanan konten tersedia.';

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
            to="/pages"
            className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-console underline"
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
            to="/banners"
            className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-console underline"
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
              <table className={`${tableClass} min-w-[40rem]`}>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )
        }
      </AsyncView>
      <p className="text-sm text-ink-700">{EDITOR_NOTE}</p>
    </div>
  );
}

export function BannersPage() {
  const banners = useBanners();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Banner"
        description="Banner menurut website, halaman, slot, dan periode tayang."
        aside={banners.data ? <DataNotice meta={banners.data.meta} /> : null}
      />
      <AsyncView
        state={banners}
        errorTitle="Daftar banner tidak dapat dimuat"
        loadingLabel="Memuat banner"
      >
        {(envelope) =>
          envelope.data.length === 0 ? (
            <EmptyState
              title="Belum ada banner"
              description="Banner yang Anda buat akan muncul di sini."
            />
          ) : (
            <TableScroll
              label="Daftar banner"
              scrollHint="Geser tabel ke samping untuk melihat periode dan status."
            >
              <table className={`${tableClass} min-w-[44rem]`}>
                <thead>
                  <tr>
                    <th scope="col" className={thClass}>
                      Judul
                    </th>
                    <th scope="col" className={thClass}>
                      Website
                    </th>
                    <th scope="col" className={thClass}>
                      Halaman dan slot
                    </th>
                    <th scope="col" className={thClass}>
                      Periode tayang
                    </th>
                    <th scope="col" className={thClass}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {envelope.data.map((banner) => (
                    <tr key={banner.id}>
                      <th scope="row" className={`${tdClass} text-left font-semibold`}>
                        {banner.title}
                      </th>
                      <td className={tdClass}>{siteLabel[banner.site]}</td>
                      <td className={`${tdClass} text-ink-700`}>
                        {banner.page}, slot {banner.slot}
                      </td>
                      <td className={`${tdClass} whitespace-nowrap`}>
                        {formatDate(banner.startsAt)} sampai {formatDate(banner.endsAt)}
                      </td>
                      <td className={tdClass}>
                        <ContentStatusBadge status={banner.status} />
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
        Banner boleh menunjuk program atau produk, tetapi judul, harga, syarat, dan periodenya tetap
        diambil dari data milik Admin operasional. {EDITOR_NOTE}
      </p>
    </div>
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
      <p className="text-sm text-ink-700">Pemulihan versi belum aktif.</p>
    </div>
  );
}
