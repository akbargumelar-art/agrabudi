import { DataNotice, cn } from '@agrabudi/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CollapsibleSection } from '@/components/Collapsible';
import { AreaList, ChannelList, OfficeList } from '@/components/company';
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
            <section
              aria-labelledby="visi-misi"
              className="grid gap-4 tablet:grid-cols-[16rem_minmax(0,1fr)] tablet:gap-8"
            >
              <h2 id="visi-misi" className="text-xl font-bold">
                Visi dan misi
              </h2>
              <div className="max-w-prose">
                <p className="font-semibold">{company.data.vision}</p>
                <ul className="mt-3 list-disc space-y-1.5 pl-5">
                  {company.data.missions.map((mission) => (
                    <li key={mission}>{mission}</li>
                  ))}
                </ul>
              </div>
            </section>
            <div className="flex flex-col gap-3" data-about-sections>
              <CollapsibleSection
                id="area-layanan"
                title="Area layanan"
                summary={`${company.data.areas.length} wilayah`}
              >
                <AreaList areas={company.data.areas} headingLevel="h3" />
              </CollapsibleSection>
              <CollapsibleSection
                id="lokasi-kantor"
                title="Lokasi kantor"
                summary={`${company.data.offices.length} kantor`}
              >
                <OfficeList offices={company.data.offices} />
              </CollapsibleSection>
              <CollapsibleSection
                id="hubungi-kami"
                title="Hubungi Kami"
                summary="Kanal resmi dan formulir pesan"
              >
                <ChannelList channels={company.data.channels} />
                <Link href="/kontak" className={cn(linkClass, 'mt-3')}>
                  Kirim pesan lewat formulir
                </Link>
              </CollapsibleSection>
            </div>
          </>
        )}
      </div>
    </>
  );
}
