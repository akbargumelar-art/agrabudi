import type { Metadata } from 'next';
import Link from 'next/link';
import { PendingContent } from '@/components/Notices';
import { PageIntro, pageBodyClass } from '@/components/PageIntro';

export const metadata: Metadata = { title: 'Tentang Kami' };

const sections = [
  { id: 'profil', title: 'Profil perusahaan', what: 'Profil perusahaan' },
  { id: 'sejarah', title: 'Sejarah', what: 'Sejarah perusahaan' },
  { id: 'visi-misi', title: 'Visi dan misi', what: 'Visi dan misi' },
];

export default function AboutPage() {
  return (
    <>
      <PageIntro title="Tentang Kami" description="PT Agrabudi Komunika." />
      <div className={pageBodyClass}>
        {sections.map((section) => (
          <section
            key={section.id}
            aria-labelledby={section.id}
            className="grid gap-4 tablet:grid-cols-[16rem_minmax(0,1fr)] tablet:gap-8"
          >
            <h2 id={section.id} className="text-xl font-bold">
              {section.title}
            </h2>
            <PendingContent what={section.what} />
          </section>
        ))}
        <nav aria-label="Halaman terkait" className="border-t border-surface-100 pt-6">
          <ul className="flex flex-wrap gap-x-6">
            {[
              { href: '/tentang/area', label: 'Area layanan' },
              { href: '/tentang/kantor', label: 'Lokasi kantor' },
              { href: '/kontak', label: 'Hubungi Kami' },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-11 items-center font-semibold underline decoration-brand-red decoration-2 underline-offset-4"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
