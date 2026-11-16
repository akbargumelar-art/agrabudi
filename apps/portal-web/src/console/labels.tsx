import type { AppId, ContentStatus, PublicationRecord } from '@agrabudi/contracts';
import { StatusBadge, type StatusTone } from '@agrabudi/ui';

export const siteLabel: Record<AppId, string> = {
  public: 'Publik',
  outlet: 'Outlet',
  portal: 'Portal',
};

export const objectTypeLabel: Record<PublicationRecord['objectType'], string> = {
  page: 'Halaman',
  banner: 'Banner',
  navigation: 'Navigasi',
  layout: 'Layout',
};

const contentStatus: Record<ContentStatus, { label: string; tone: StatusTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  review: { label: 'Menunggu review', tone: 'warning' },
  published: { label: 'Terbit', tone: 'success' },
  archived: { label: 'Diarsipkan', tone: 'neutral' },
};

export const contentStatusLabel: Record<ContentStatus, string> = {
  draft: contentStatus.draft.label,
  review: contentStatus.review.label,
  published: contentStatus.published.label,
  archived: contentStatus.archived.label,
};

export function ContentStatusBadge({ status }: { status: ContentStatus }) {
  const { label, tone } = contentStatus[status];
  return <StatusBadge tone={tone}>{label}</StatusBadge>;
}
