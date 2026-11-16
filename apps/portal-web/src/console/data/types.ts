import type { AppId } from '@agrabudi/contracts';

/**
 * Bentuk data pengaturan website yang belum masuk packages/contracts. Kontrak ini sementara
 * untuk fase frontend dan dipindah ke contracts saat CMS API dibuat.
 */
export type NavItem = {
  id: string;
  site: AppId;
  label: string;
  href: string;
  visible: boolean;
  /** Menu milik modul bisnis: tidak bisa disembunyikan dari menu Website. */
  locked: boolean;
};

export type LayoutSection = {
  id: string;
  page: string;
  label: string;
  component: string;
  visible: boolean;
};

export type SiteAsset = {
  id: string;
  name: string;
  kind: 'logo' | 'foto' | 'banner' | 'ilustrasi';
  url: string;
  sizeKb: number;
  uploadedAt: string;
};

export type AuditEvent = {
  id: string;
  at: string;
  actor: string;
  action: string;
  object: string;
};
