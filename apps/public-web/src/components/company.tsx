import type { CompanyProfile } from '@agrabudi/contracts';
import { cardClass, cn } from '@agrabudi/ui';
import {
  AtSign,
  Clock,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ThumbsUp,
} from 'lucide-react';

type Channel = CompanyProfile['channels'][number];

const channelIcon = {
  whatsapp: MessageCircle,
  phone: Phone,
  email: Mail,
  instagram: AtSign,
  facebook: ThumbsUp,
  website: Globe,
} as const;

/** Tautan kanal kontak. Nilai yang tidak bisa diubah jadi tautan aman tetap tampil sebagai teks. */
export function channelHref(channel: Channel): string | null {
  const value = channel.value.trim();
  switch (channel.kind) {
    case 'whatsapp': {
      const digits = value.replace(/\D/g, '');
      if (digits.length < 9) return null;
      return `https://wa.me/${digits.startsWith('0') ? `62${digits.slice(1)}` : digits}`;
    }
    case 'phone': {
      const digits = value.replace(/[^\d+]/g, '');
      return digits.length >= 6 ? `tel:${digits}` : null;
    }
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? `mailto:${value}` : null;
    case 'instagram': {
      const handle = value.replace(/^@/, '');
      return /^[A-Za-z0-9._]{1,30}$/.test(handle) ? `https://www.instagram.com/${handle}` : null;
    }
    case 'facebook':
    case 'website': {
      if (/\s/.test(value) || !value.includes('.')) return null;
      return value.startsWith('https://') ? value : `https://${value.replace(/^http:\/\//, '')}`;
    }
  }
}

export function OfficeList({ offices }: { offices: CompanyProfile['offices'] }) {
  return (
    <ul className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
      {offices.map((office) => (
        <li key={office.id} className={cn(cardClass, 'flex flex-col overflow-hidden')}>
          {office.imageUrl ? (
            <img
              src={office.imageUrl}
              alt={`Gambar ${office.name}`}
              loading="lazy"
              className="aspect-3/2 w-full object-cover"
            />
          ) : null}
          <div className="flex flex-col gap-3 p-5">
            <h3 className="text-lg font-bold">{office.name}</h3>
            {office.address ? (
              <p className="flex items-start gap-2 text-sm">
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-red" />
                {office.address}
              </p>
            ) : null}
            {office.hours ? (
              <p className="flex items-start gap-2 text-sm">
                <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-red" />
                {office.hours}
              </p>
            ) : null}
            {office.phone ? (
              <p className="flex items-start gap-2 text-sm">
                <Phone aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-red" />
                {office.phone}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ChannelList({ channels }: { channels: CompanyProfile['channels'] }) {
  return (
    <ul className={cn(cardClass, 'divide-y divide-surface-100')}>
      {channels.map((channel) => {
        const Icon = channelIcon[channel.kind];
        const href = channelHref(channel);
        const body = (
          <>
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-red-soft text-brand-red">
              <Icon aria-hidden className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-ink-700">{channel.label}</span>
              <span className="block font-semibold break-words">{channel.value}</span>
            </span>
            {href ? <ExternalLink aria-hidden className="size-4 shrink-0 text-ink-500" /> : null}
          </>
        );
        return (
          <li key={`${channel.kind}-${channel.value}`}>
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-16 items-center gap-4 p-4 hover:bg-surface-50"
              >
                {body}
              </a>
            ) : (
              <span className="flex items-center gap-4 p-4">{body}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
