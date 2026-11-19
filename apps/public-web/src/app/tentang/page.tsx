import { DataNotice, IconBadge, cardClass, cn, type IconComponent } from '@agrabudi/ui';
import { Handshake, MapPinned, Smartphone, Store, Trophy, Wifi } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CollapsibleSection } from '@/components/Collapsible';
import { AreaList, ChannelList, OfficeList } from '@/components/company';
import { SectionUnavailable } from '@/components/Notices';
import { PageIntro, pageBodyClass } from '@/components/PageIntro';
import { load } from '@/data';
import { officialChannels } from '@/lib/contact';
import { splitLabeled, splitList } from '@/lib/labeled';

export const metadata: Metadata = { title: 'Tentang Kami' };

const linkClass =
  'inline-flex min-h-11 items-center font-semibold underline decoration-brand-red decoration-2 underline-offset-4';

/** Ikon kartu profil dipilih dari judul isian CMS; judul lain memakai ikon kemitraan. */
function iconFor(title: string): IconComponent {
  const key = title.toLowerCase();
  if (key.includes('mobile')) return Smartphone;
  if (key.includes('household') || key.includes('indihome')) return Wifi;
  if (key.includes('grapari') || key.includes('gerai')) return Store;
  return Handshake;
}

const awardKey = 'penghargaan';

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
            {(() => {
              const about = company.data.about.map(splitLabeled);
              const intro = about.filter((item) => item.title === null);
              const cards = about.filter((item) => item.title !== null);
              const districts = company.data.areas.reduce((n, a) => n + a.districts.length, 0);
              return (
                <section aria-labelledby="profil" className="flex flex-col gap-6">
                  <h2 id="profil" className="sr-only">
                    Profil perusahaan
                  </h2>
                  {intro.map((item) => (
                    <p key={item.body} className="max-w-3xl text-lg leading-relaxed text-ink-900">
                      {item.body}
                    </p>
                  ))}
                  {company.data.areas.length > 0 ? (
                    <Link
                      href="/tentang/area"
                      className={cn(
                        cardClass,
                        'flex w-fit items-center gap-4 p-4 pr-6 hover:bg-surface-50',
                      )}
                    >
                      <IconBadge icon={MapPinned} />
                      <span>
                        <span className="block text-2xl font-extrabold text-brand-red">
                          {company.data.areas.length} cluster · {districts} kabupaten/kota
                        </span>
                        <span className="block text-sm text-ink-700">Wilayah layanan kami</span>
                      </span>
                    </Link>
                  ) : null}
                  {cards.length > 0 ? (
                    <ul className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
                      {cards.map((item) => (
                        <li key={item.title} className={cn(cardClass, 'flex flex-col gap-3 p-5')}>
                          <IconBadge icon={iconFor(item.title!)} />
                          <h3 className="text-lg font-bold">{item.title}</h3>
                          <p className="text-sm text-ink-700">{item.body}</p>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              );
            })()}
            {(() => {
              const history = company.data.history.map(splitLabeled);
              const awards = history.find((item) => item.title?.toLowerCase() === awardKey);
              const steps = history.filter((item) => item.title?.toLowerCase() !== awardKey);
              return (
                <>
                  {steps.length > 0 ? (
                    <section aria-labelledby="sejarah">
                      <h2 id="sejarah" className="text-xl font-bold">
                        Perjalanan kemitraan
                      </h2>
                      <ol className="mt-5 grid gap-4 tablet:grid-cols-3">
                        {steps.map((item, index) => (
                          <li
                            key={item.body}
                            className={cn(
                              cardClass,
                              'relative flex flex-col gap-2 p-5',
                              index === steps.length - 1 && 'border-brand-red',
                            )}
                          >
                            <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand-red-soft text-sm font-bold text-brand-red-strong">
                              {index + 1}
                            </span>
                            {item.title ? (
                              <h3 className="text-2xl font-extrabold">{item.title}</h3>
                            ) : null}
                            <p className="text-sm text-ink-700">{item.body}</p>
                            {index === steps.length - 1 && steps.length > 1 ? (
                              <span className="w-fit rounded-full bg-brand-red px-3 py-1 text-xs font-bold text-white">
                                Sekarang
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ol>
                    </section>
                  ) : null}
                  {awards ? (
                    <section aria-labelledby="penghargaan">
                      <h2 id="penghargaan" className="text-xl font-bold">
                        Penghargaan
                      </h2>
                      <ul className="mt-5 grid gap-3 tablet:grid-cols-2">
                        {splitList(awards.body).map((award) => (
                          <li key={award} className={cn(cardClass, 'flex items-center gap-4 p-4')}>
                            <IconBadge icon={Trophy} />
                            <span className="font-semibold">{award}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </>
              );
            })()}
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
            <div className="flex flex-col gap-3" data-about-sections>
              <CollapsibleSection
                id="area-layanan"
                title="Area layanan"
                summary={`${company.data.areas.length} wilayah`}
              >
                <AreaList areas={company.data.areas} headingLevel="h3" />
              </CollapsibleSection>
              {company.data.offices.length > 0 ? (
                <CollapsibleSection
                  id="lokasi-kantor"
                  title="Lokasi kantor"
                  summary={`${company.data.offices.length} kantor`}
                >
                  <OfficeList offices={company.data.offices} />
                </CollapsibleSection>
              ) : null}
              <CollapsibleSection
                id="hubungi-kami"
                title="Hubungi Kami"
                summary="Kanal resmi dan formulir pesan"
              >
                <ChannelList
                  channels={
                    company.data.channels.length > 0 ? company.data.channels : officialChannels
                  }
                />
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
