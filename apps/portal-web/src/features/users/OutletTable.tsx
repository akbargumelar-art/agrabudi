import type { ManagedOutletAccount } from '@agrabudi/contracts';
import { Button, TableScroll, formatDate, tableClass, tdClass, thClass } from '@agrabudi/ui';
import { AccountStatusBadge } from './shared';
import { resetBlocked } from './StaffTable';

/** Tabel akun outlet. ID Digipos tetap teks, nol di depan tidak hilang. */
export function OutletTable({
  accounts,
  onEdit,
  onReset,
}: {
  accounts: ManagedOutletAccount[];
  onEdit: (account: ManagedOutletAccount) => void;
  onReset: (account: ManagedOutletAccount) => void;
}) {
  return (
    <TableScroll label="Akun Outlet" scrollHint="Geser untuk melihat status dan aksi">
      <table className={tableClass}>
        <thead>
          <tr>
            <th className={thClass}>Outlet</th>
            <th className={thClass}>ID Digipos</th>
            <th className={thClass}>Pemilik</th>
            <th className={thClass}>Nomor WhatsApp</th>
            <th className={thClass}>Terdaftar</th>
            <th className={thClass}>Status</th>
            <th className={thClass}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => {
            const blocked = resetBlocked({ status: account.status, phone: account.phone || null });
            return (
              <tr key={account.id}>
                <td className={tdClass}>
                  <span className="font-medium">{account.outletName}</span>
                  {account.tap ? (
                    <span className="block text-xs text-ink-700">{account.tap}</span>
                  ) : null}
                </td>
                <td className={tdClass}>{account.digiposId}</td>
                <td className={tdClass}>{account.ownerName}</td>
                <td className={tdClass}>{account.phone || 'Belum diisi'}</td>
                <td className={`${tdClass} whitespace-nowrap`}>
                  {formatDate(account.registeredAt)}
                </td>
                <td className={tdClass}>
                  <AccountStatusBadge
                    status={account.status}
                    mustChangePassword={account.mustChangePassword}
                  />
                </td>
                <td className={tdClass}>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      aria-label={`Ubah ${account.digiposId}`}
                      onClick={() => onEdit(account)}
                    >
                      Ubah
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={blocked !== undefined}
                      title={blocked}
                      aria-label={`Reset kata sandi ${account.digiposId}`}
                      onClick={() => onReset(account)}
                    >
                      Reset sandi
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableScroll>
  );
}
