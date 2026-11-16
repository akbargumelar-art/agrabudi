/**
 * Route registry Portal. Satu sumber untuk sidebar, halaman "Semua Menu",
 * dan pencocokan URL. Nama menu mengikuti PRD 2.8-2.10 apa adanya;
 * singkatan bisnis tidak diekspansi (PRD 3.3).
 */
export type SectionId = 'telkomsel' | 'indihome' | 'admin' | 'website';

export type ModuleLeaf = {
  label: string;
  slug: string;
  /** Path tujuan bila menu ini hanya alias ke modul lain, bukan data kedua. */
  aliasOf?: string;
};

export type ModuleGroup = ModuleLeaf & {
  /** "Perilaku inti" dari PRD untuk menu ini. */
  behavior: string;
  children?: ModuleLeaf[];
};

export type Section = {
  id: SectionId;
  label: string;
  prefix: string;
  description: string;
  /** Path yang dibuka saat pengguna masuk ke bagian ini. */
  home: string;
  groups: ModuleGroup[];
};

export type ModuleRoute = {
  path: string;
  title: string;
  section: Section;
  group: ModuleGroup;
  leaf?: ModuleLeaf;
  aliasOf?: string;
};
