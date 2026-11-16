import { admin } from './admin';
import { indihome } from './indihome';
import { telkomsel } from './telkomsel';
import { website } from './website';
import type { ModuleRoute, Section } from './types';

export type { ModuleGroup, ModuleLeaf, ModuleRoute, Section, SectionId } from './types';

export const sections: Section[] = [telkomsel, indihome, admin, website];

function buildRoutes(): ModuleRoute[] {
  const routes: ModuleRoute[] = [];
  for (const section of sections) {
    for (const group of section.groups) {
      const groupPath = `${section.prefix}/${group.slug}`;
      routes.push({ path: groupPath, title: group.label, section, group, aliasOf: group.aliasOf });
      for (const leaf of group.children ?? []) {
        routes.push({
          path: `${groupPath}/${leaf.slug}`,
          title: leaf.label,
          section,
          group,
          leaf,
          aliasOf: leaf.aliasOf,
        });
      }
    }
  }
  return routes;
}

export const moduleRoutes: ModuleRoute[] = buildRoutes();

const routeByPath = new Map(moduleRoutes.map((route) => [route.path, route]));

function normalize(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function findModuleRoute(pathname: string): ModuleRoute | undefined {
  return routeByPath.get(normalize(pathname));
}

export function findSection(pathname: string): Section | undefined {
  const path = normalize(pathname);
  return sections.find(
    (section) => path === section.prefix || path.startsWith(`${section.prefix}/`),
  );
}
