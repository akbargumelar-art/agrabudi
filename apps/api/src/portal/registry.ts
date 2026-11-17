import { applicationsModule, vacanciesModule } from './modules/career';
import {
  customerProductsModule,
  outletCategoriesModule,
  outletPackagesModule,
} from './modules/catalog';
import { cuanProductsModule } from './modules/cuan';
import { outletOrdersModule } from './modules/orders';
import {
  customerProgramsModule,
  internalProgramsModule,
  outletProgramsModule,
} from './modules/programs';
import {
  digiposRegistrationsModule,
  indihomeLeadsModule,
  indihomePackagesModule,
} from './modules/services';
import type { PortalModule } from './types';

/**
 * Modul Portal yang sudah tersambung. Semua ada di bagian Admin operasional dan memakai
 * entitas berkontrak. Menu Telkomsel/IndiHome lain (sales plan, KPI, fee, DOA, dan
 * seterusnya) sengaja belum ada di sini sampai kamus datanya disahkan (PRD 2.8, AS-10).
 */
const modules: PortalModule[] = [
  vacanciesModule,
  applicationsModule,
  customerProductsModule,
  outletCategoriesModule,
  outletPackagesModule,
  outletOrdersModule,
  indihomePackagesModule,
  indihomeLeadsModule,
  customerProgramsModule,
  outletProgramsModule,
  internalProgramsModule,
  digiposRegistrationsModule,
  cuanProductsModule,
];

const byPath = new Map(modules.map((module) => [module.path, module]));

export function findPortalModule(path: string): PortalModule | undefined {
  return byPath.get(path);
}

export const integratedModulePaths = modules.map((module) => module.path);

/** Kelompok menu Admin dari path, mis. /admin/kelola-karir/lowongan -> kelola-karir. */
export function adminGroupOf(path: string): string | null {
  const match = /^\/admin\/([a-z0-9-]+)(\/|$)/.exec(path);
  return match?.[1] ?? null;
}
