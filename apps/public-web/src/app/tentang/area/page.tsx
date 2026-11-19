import { DataNotice, cardClass, cn } from '@agrabudi/ui';
import { MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionUnavailable } from '@/components/Notices';
import { PageIntro, pageBodyClass } from '@/components/PageIntro';
import { load } from '@/data';

export const metadata: Metadata = { title: 'Area layanan' };

export default async function AreaPage() {
  const company = await load((adapter) => adapter.getCompanyProfile());
  return (
    <>
      <PageIntro
        title="Area layanan"
        description="Wilayah yang dilayani PT Agrabudi Komunika."
        aside={company.ok ? <DataNotice meta={company.meta} /> : null}
        back={
          <Link href="/tentang" className="font-medium text-info underline">
            Tentang Kami
          </Link>
        }
      />
      <div className={pageBodyClass}>
        {!company.ok ? (
          <SectionUnavailable title="Area layanan tidak dapat dimuat" message={company.message} />
        ) : (
          <ul className="grid gap-4 tablet:grid-cols-3">
            {company.data.areas.map((area) => (
              <li key={area.name} className={cn(cardClass, 'p-5')}>
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <MapPin aria-hidden className="size-5 text-brand-red" />
                  {area.name}
                </h2>
                <p className="mt-1 text-sm text-ink-700">{area.districts.length} wilayah</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {area.districts.map((district) => (
                    <li
                      key={district}
                      className="rounded-full bg-surface-50 px-3 py-1 text-sm text-ink-900"
                    >
                      {district}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
