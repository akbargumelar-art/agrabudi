import { DataNotice } from '@agrabudi/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AreaList } from '@/components/company';
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
          <AreaList areas={company.data.areas} />
        )}
      </div>
    </>
  );
}
