import type { StaffSession } from '@agrabudi/contracts';
import { describe, expect, it } from 'vitest';
import { demoAccounts } from '../../auth/mock';
import { moduleRoutes } from '../../registry';
import { mockPortalAdapter } from './adapter';
import { datasetRegistry } from './datasets';
import { personByUsername } from './org';

const account = (username: string) => demoAccounts.find((item) => item.username === username) as StaffSession;

/** Menu daun (tanpa submenu) di luar Website wajib punya data contoh. */
const leafPaths = moduleRoutes
  .filter((route) => route.section.id !== 'website' && !route.aliasOf && (route.leaf || !route.group.children))
  .map((route) => route.path);

describe('data contoh Portal', () => {
  it('setiap menu daun punya dataset', () => {
    const shared = ['/admin/indihome/database-pelanggan', '/admin/indihome/input-order', '/admin/indihome/status', '/admin/admin-input/outlet'];
    const missing = leafPaths.filter((path) => !datasetRegistry[path] && !shared.includes(path));
    expect(missing).toEqual([]);
  });

  it('setiap dataset terbentuk dan kolom wajibnya terisi', () => {
    for (const [path, build] of Object.entries(datasetRegistry)) {
      const spec = build();
      expect(spec.columns.length, path).toBeGreaterThan(0);
      expect(spec.rows.length, path).toBeGreaterThan(0);
      for (const row of spec.rows) {
        for (const column of spec.columns) expect(column.key in row.cells, `${path} ${column.key}`).toBe(true);
      }
    }
  });

  it('salesforce hanya melihat datanya sendiri', async () => {
    const session = account('sfmobile');
    const me = personByUsername('sfmobile');
    const envelope = await mockPortalAdapter.getDataset('/telkomsel/sellthru/st-digipos', session);
    expect(envelope.data?.rows.length).toBeGreaterThan(0);
    expect(envelope.data?.rows.every((row) => row.ownerId === me?.id)).toBe(true);
    expect(envelope.data?.editable).toBe(false);
  });

  it('supervisor hanya melihat tim yang dipegangnya', async () => {
    const cluster = await mockPortalAdapter.getDataset('/telkomsel/sellthru/st-digipos', account('adminmobile'));
    const team = await mockPortalAdapter.getDataset('/telkomsel/sellthru/st-digipos', account('spvmobile'));
    expect(team.data?.rows.length).toBeGreaterThan(0);
    expect(team.data?.rows.length).toBeLessThan(cluster.data?.rows.length ?? 0);
  });

  it('akses lihat tidak bisa mengubah data', async () => {
    await expect(
      mockPortalAdapter.saveRow('/telkomsel/sellthru/st-digipos', { cells: { jumlah: 1 } }, account('manager')),
    ).rejects.toThrow();
  });

  it('salesforce bisa menambah order miliknya sendiri', async () => {
    const session = account('sfhousehold');
    const me = personByUsername('sfhousehold');
    const path = '/indihome/pelanggan/input-order';
    const before = await mockPortalAdapter.getDataset(path, session);
    expect(before.data?.ownerCreate).toBe(true);
    await mockPortalAdapter.saveRow(path, { cells: { pelanggan: 'Pelanggan Uji', status: 'IO' } }, session);
    const after = await mockPortalAdapter.getDataset(path, session);
    expect(after.data?.rows.length).toBe((before.data?.rows.length ?? 0) + 1);
    expect(after.data?.rows[0]?.ownerId).toBe(me?.id);
  });
});
