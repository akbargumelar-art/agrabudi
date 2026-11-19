import type { CompanyProfile } from '@agrabudi/contracts';
import { cardClass, cn } from '@agrabudi/ui';
import { AtSign, Clock, ExternalLink, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';

const channelIcon = {
  whatsapp: MessageCircle,
  phone: Phone,
  email: Mail,
  instagram: AtSign,
} as const;

/** Tautan ke peta, bukan peta tertanam: tanpa skrip pihak ketiga dan tanpa iframe. */
function mapUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

/** Daftar wilayah layanan; dipakai di /tentang/area dan bagian Area layanan di /tentang. */
export function AreaList({
  areas,
  headingLevel = 'h2',
}: {
  areas: CompanyProfile['areas'];
  headingLevel?: 'h2' | 'h3';
}) {
  const Heading = headingLevel;
  return (
    <ul className="grid gap-4 tablet:grid-cols-3">
      {areas.map((area) => (
        <li key={area.name} className={cn(cardClass, 'flex flex-col overflow-hidden')}>
          {area.imageUrl ? (
            <img
              src={area.imageUrl}
              alt={`Foto wilayah ${area.name}`}
              loading="lazy"
              className="aspect-3/2 w-full object-cover"
            />
          ) : null}
          <div className="flex flex-1 flex-col p-5">
            <Heading className="flex items-center gap-2 text-lg font-bold">
              <MapPin aria-hidden className="size-5 text-brand-red" />
              {area.name}
            </Heading>
            <p className="mt-1 text-sm text-ink-700">{area.districts.length} kecamatan</p>
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
            {area.latitude !== null && area.longitude !== null ? (
              <a
                href={mapUrl(area.latitude, area.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex min-h-11 items-center gap-2 self-start text-sm font-medium text-info underline"
              >
                <ExternalLink aria-hidden className="size-4" />
                Buka {area.name} di peta
                <span className="sr-only">(tab baru)</span>
              </a>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

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
