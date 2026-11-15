import type { Metadata } from 'next';
import Link from 'next/link';
import { PendingContent } from '@/components/Notices';
import { PageIntro, pageBodyClass } from '@/components/PageIntro';

export const metadata: Metadata = { title: 'Area layanan' };

export default function AreaPage() {
  return (
    <>
      <PageIntro
        title="Area layanan"
        description="Wilayah yang dilayani PT Agrabudi Komunika."
        back={
          <Link href="/tentang" className="font-medium text-info underline">
            Tentang Kami
          </Link>
        }
      />
      <div className={pageBodyClass}>
        <PendingContent what="Daftar wilayah layanan" />
      </div>
    </>
  );
}
