import type { Metadata } from 'next';
import Link from 'next/link';
import { PendingContent } from '@/components/Notices';
import { PageIntro, pageBodyClass } from '@/components/PageIntro';

export const metadata: Metadata = { title: 'Lokasi kantor' };

export default function OfficePage() {
  return (
    <>
      <PageIntro
        title="Lokasi kantor"
        description="Alamat, jam layanan, kontak, dan peta kantor."
        back={
          <Link href="/tentang" className="font-medium text-info underline">
            Tentang Kami
          </Link>
        }
      />
      <div className={pageBodyClass}>
        <PendingContent what="Alamat, jam layanan, dan peta kantor" />
      </div>
    </>
  );
}
