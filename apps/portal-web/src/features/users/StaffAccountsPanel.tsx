import {
  MANAGED_UNITS,
  type CredentialIssueResult,
  type ManagedStaffAccount,
} from '@agrabudi/contracts';
import { AsyncView, Button, DataNotice, useToast } from '@agrabudi/ui';
import { useState } from 'react';
import { useSession } from '../../auth/SessionContext';
import { useResetStaff, useStaffAccounts } from './queries';
import { ConfirmResetDialog, IssuedDialog, errorsOf } from './shared';
import { CreateStaffDialog, EditStaffDialog } from './StaffDialogs';
import { StaffTable, unitLabel } from './StaffTable';

/** Akun Portal di unit yang dikelola Admin ini. Manager dan Admin Web tidak dikelola dari sini. */
export function StaffAccountsPanel() {
  const session = useSession();
  const accounts = useStaffAccounts();
  const reset = useResetStaff();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ManagedStaffAccount | null>(null);
  const [resetting, setResetting] = useState<ManagedStaffAccount | null>(null);
  const [issued, setIssued] = useState<{ result: CredentialIssueResult; label: string } | null>(
    null,
  );
  const units = session.unit ? MANAGED_UNITS[session.unit] : [];

  function runReset(account: ManagedStaffAccount) {
    reset.mutate(account.id, {
      onSuccess: (result) => {
        setResetting(null);
        setIssued({ result, label: account.username });
      },
      onError: (error) => {
        setResetting(null);
        toast.show({ tone: 'danger', message: `Reset gagal. ${errorsOf(error).message}` });
      },
    });
  }

  return (
    <section aria-labelledby="akun-portal" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="akun-portal" className="text-lg font-bold">
            Akun Portal
          </h2>
          {accounts.data ? <DataNotice meta={accounts.data.meta} /> : null}
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          Tambah akun Portal
        </Button>
      </div>
      <p className="max-w-prose text-sm text-ink-700">
        Unit yang Anda kelola: {units.map((unit) => unitLabel[unit]).join(', ')}. Kata sandi awal
        dibuat acak oleh sistem dan dikirim ke WhatsApp pemilik akun.
      </p>
      <AsyncView
        state={accounts}
        errorTitle="Daftar akun tidak dapat dimuat"
        loadingLabel="Memuat akun"
      >
        {(envelope) => (
          <StaffTable accounts={envelope.data} onEdit={setEditing} onReset={setResetting} />
        )}
      </AsyncView>

      <CreateStaffDialog
        open={creating}
        units={units}
        grantable={session.permissions}
        onClose={() => setCreating(false)}
        onCreated={(result, label) => {
          setCreating(false);
          setIssued({ result, label });
        }}
      />
      <EditStaffDialog account={editing} onClose={() => setEditing(null)} />
      <ConfirmResetDialog
        target={resetting ? { label: resetting.username, phone: resetting.phone ?? '' } : null}
        busy={reset.isPending}
        onCancel={() => setResetting(null)}
        onConfirm={() => resetting && runReset(resetting)}
      />
      <IssuedDialog
        result={issued?.result ?? null}
        label={issued?.label ?? ''}
        onClose={() => setIssued(null)}
      />
    </section>
  );
}
