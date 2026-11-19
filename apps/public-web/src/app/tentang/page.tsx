import { DataNotice } from '@agrabudi/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { OfficeList } from '@/components/company';
import { SectionUnavailable } from '@/components/Notices';
import { PageIntro, pageBodyClass } from '@/components/PageIntro';
import { load } from '@/data';

export const metadata: Metadata = { title: 'Tentang Kami' };

const linkClass =
  'inline-flex min-h-11 items-center font-semibold underline decoration-brand-red decoration-2 underline-offset-4';

export default async function AboutPage() {
  const company = await load((adapter) => adapter.getCompanyProfile());
  return (
    <>
      <PageIntro
        title="Tentang Kami"
        description="PT Agrabudi Komunika."
        aside={company.ok ? <DataNotice meta={company.meta} /> : null}
      />
      <div className={pageBodyClass}>
        {!company.ok ? (
          <SectionUnavailable
            title="Profil perusahaan tidak dapat dimuat"
            message={company.message}
          />
        ) : (
          <>
            <section
              aria-labelledby="profil"
              className="grid gap-4 tablet:grid-cols-[16rem_minmax(0,1fr)] tablet:gap-8"
            >
              <h2 id="profil" className="text-xl font-bold">
                Profil perusahaan
              </h2>
              <div className="flex max-w-prose flex-col gap-3">
                {company.data.about.map((text) => (
                  <p key={text}>{text}</p>
                ))}
              </div>
            </section>
            {company.data.history.length > 0 ? (
              <section
                aria-labelledby="sejarah"
                className="grid gap-4 tablet:grid-cols-[16rem_minmax(0,1fr)] tablet:gap-8"
              >
                <h2 id="sejarah" className="text-xl font-bold">
                  Sejarah
                </h2>
                <div className="flex max-w-prose flex-col gap-3">
                  {company.data.history.map((text) => (
                    <p key={text}>{text}</p>
                  ))}
                </div>
              </section>
            ) : null}
            {company.data.vision || company.data.missions.length > 0 ? (
              <section
                aria-labelledby="visi-misi"
                className="grid gap-4 tablet:grid-cols-[16rem_minmax(0,1fr)] tablet:gap-8"
              >
                <h2 id="visi-misi" className="text-xl font-bold">
                  Visi dan misi
                </h2>
                <div className="max-w-prose">
                  {company.data.vision ? (
                    <p className="font-semibold">{company.data.vision}</p>
                  ) : null}
                  <ul className="mt-3 list-disc space-y-1.5 pl-5">
                    {company.data.missions.map((mission) => (
                      <li key={mission}>{mission}</li>
                    ))}
                  </ul>
                </div>
              </section>
            ) : null}
            {company.data.offices.length > 0 ? (
              <section aria-labelledby="kantor-kami">
                <h2 id="kantor-kami" className="text-xl font-bold">
                  Kantor kami
                </h2>
                <div className="mt-4">
                  <OfficeList offices={company.data.offices} />
                </div>
              </section>
            ) : null}
          </>
        )}
        <nav aria-label="Halaman terkait" className="border-t border-surface-100 pt-6">
          <ul className="flex flex-wrap gap-x-6">
            <li>
              <Link href="/tentang/area" className={linkClass}>
                Area layanan
              </Link>
            </li>
            <li>
              <Link href="/tentang/kantor" className={linkClass}>
                Lokasi kantor
              </Link>
            </li>
            <li>
              <Link href="/kontak" className={linkClass}>
                Hubungi Kami
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
}
