import type { BusinessUnit, ManagedStaffAccount, StaffPermission } from '@agrabudi/contracts';
import { Button, TableScroll, tableClass, tdClass, thClass } from '@agrabudi/ui';
import { roleLabel } from '../../auth/access';
import { AccountStatusBadge } from './shared';

export const unitLabel: Record<BusinessUnit, string> = {
  mobile: 'Mobile',
  household: 'Household',
  direct_sales: 'Direct Sales',
};
export const permissionLabel: Record<StaffPermission, string> = {
  'career.manage': 'Kelola Karir',
  'user.manage': 'Kelola pengguna',
};

export function resetBlocked(account: { status: string; phone: string | null }) {
  if (account.status !== 'active') return 'Aktifkan akun dulu.';
  if (!account.phone) return 'Isi nomor WhatsApp dulu.';
  return undefined;
}

/** Tabel akun Portal. Di HP tabel bergeser di kontainernya sendiri (AS-05). */
export function StaffTable({
  accounts,
  onEdit,
  onReset,
}: {
  accounts: ManagedStaffAccount[];
  onEdit: (account: ManagedStaffAccount) => void;
  onReset: (account: ManagedStaffAccount) => void;
}) {
  return (
    <TableScroll label="Akun Portal" scrollHint="Geser untuk melihat status dan aksi">
      <table className={tableClass}>
        <thead>
          <tr>
            <th className={thClass}>Nama</th>
            <th className={thClass}>Username</th>
            <th className={thClass}>Peran</th>
            <th className={thClass}>Nomor WhatsApp</th>
            <th className={thClass}>Status</th>
            <th className={thClass}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.id}>
              <td className={tdClass}>
                <span className="font-medium">{account.displayName}</span>
                {account.permissions.length > 0 ? (
                  <span className="block text-xs text-ink-700">
                    Izin: {account.permissions.map((item) => permissionLabel[item]).join(', ')}
                  </span>
                ) : null}
              </td>
              <td className={tdClass}>{account.username}</td>
              <td className={`${tdClass} whitespace-nowrap`}>{roleLabel(account)}</td>
              <td className={tdClass}>{account.phone ?? 'Belum diisi'}</td>
              <td className={tdClass}>
                <AccountStatusBadge
                  status={account.status}
                  mustChangePassword={account.mustChangePassword}
                />
              </td>
              <td className={tdClass}>
                {account.isSelf ? (
                  <span className="text-xs text-ink-700">Akun Anda</span>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      aria-label={`Ubah ${account.username}`}
                      onClick={() => onEdit(account)}
                    >
                      Ubah
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={resetBlocked(account) !== undefined}
                      title={resetBlocked(account)}
                      aria-label={`Reset kata sandi ${account.username}`}
                      onClick={() => onReset(account)}
                    >
                      Reset sandi
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}
