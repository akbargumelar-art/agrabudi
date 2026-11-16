import { logoHorizontal, logoHorizontalOnDark } from '../assets/logo';
import { cn } from '../lib/cn';

type WordmarkProps = {
  /** Nama aplikasi di samping logo, misalnya "Outlet". Kosongkan untuk Publik. */
  app?: string;
  /** `dark` memakai logo dengan teks putih untuk latar gelap. */
  tone?: 'dark' | 'light';
};

/** Logo resmi Agrabudi Komunika, dengan nama aplikasi bila ada. */
export function Wordmark({ app, tone = 'light' }: WordmarkProps) {
  const dark = tone === 'dark';
  const logo = dark ? logoHorizontalOnDark : logoHorizontal;
  return (
    <span className="inline-flex items-center gap-2">
      <img
        src={logo.src}
        width={logo.width}
        height={logo.height}
        alt="Agrabudi Komunika"
        className="h-7 w-auto tablet:h-8"
      />
      {app ? (
        <span
          className={cn(
            'border-l pl-2 text-sm font-semibold',
            dark ? 'border-white/30 text-ink-300' : 'border-ink-300 text-ink-700',
          )}
        >
          {app}
        </span>
      ) : null}
    </span>
  );
}
