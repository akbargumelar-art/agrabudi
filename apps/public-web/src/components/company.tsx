import type { CompanyProfile } from '@agrabudi/contracts';
import { cardClass, cn } from '@agrabudi/ui';
import { AtSign, Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';

const channelIcon = {
  whatsapp: MessageCircle,
  phone: Phone,
  email: Mail,
  instagram: AtSign,
} as const;

export function OfficeList({ offices }: { offices: CompanyProfile['offices'] }) {
  return (
    <ul className="grid gap-4 tablet:grid-cols-2">
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
            <p className="flex items-start gap-2 text-sm">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-red" />
              {office.address}
            </p>
            <p className="flex items-start gap-2 text-sm">
              <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-red" />
              {office.hours}
            </p>
            <p className="flex items-start gap-2 text-sm">
              <Phone aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-red" />
              {office.phone}
            </p>
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
        return (
          <li key={channel.kind} className="flex items-center gap-4 p-4">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-red-soft text-brand-red">
              <Icon aria-hidden className="size-5" />
            </span>
            <span>
              <span className="block text-sm text-ink-700">{channel.label}</span>
              <span className="block font-semibold">{channel.value}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
