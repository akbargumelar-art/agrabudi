import { DataNotice } from '@agrabudi/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { OfficeList } from '@/components/company';
import { SectionUnavailable } from '@/components/Notices';
import { PageIntro, pageBodyClass } from '@/components/PageIntro';
import { load } from '@/data';

export const metadata: Metadata = { title: 'Lokasi kantor' };

export default async function OfficePage() {
  const company = await load((adapter) => adapter.getCompanyProfile());
  return (
    <>
      <PageIntro
        title="Lokasi kantor"
        description="Alamat, jam layanan, dan kontak kantor."
        aside={company.ok ? <DataNotice meta={company.meta} /> : null}
        back={
          <Link href="/tentang" className="font-medium text-info underline">
            Tentang Kami
          </Link>
        }
      />
      <div className={pageBodyClass}>
        {company.ok ? (
          <>
            <OfficeList offices={company.data.offices} />
            <p className="text-sm text-ink-700">
              Peta lokasi tampil setelah alamat dan titik koordinat resmi diisi Admin Web.
            </p>
          </>
        ) : (
          <SectionUnavailable title="Lokasi kantor tidak dapat dimuat" message={company.message} />
        )}
      </div>
    </>
  );
}
