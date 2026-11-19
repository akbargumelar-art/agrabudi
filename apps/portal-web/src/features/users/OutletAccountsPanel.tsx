import type { CredentialIssueResult, ManagedOutletAccount } from '@agrabudi/contracts';
import { AsyncView, Button, DataNotice, EmptyState, useToast } from '@agrabudi/ui';
import { useState } from 'react';
import { CreateOutletDialog, EditOutletDialog } from './OutletDialogs';
import { OutletTable } from './OutletTable';
import { useOutletAccounts, useResetOutlet } from './queries';
import { ConfirmResetDialog, IssuedDialog, errorsOf } from './shared';

/** Akun mitra outlet (login ID Digipos). Hanya Admin Mobile; diperiksa juga di server. */
export function OutletAccountsPanel() {
  const accounts = useOutletAccounts(true);
  const reset = useResetOutlet();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ManagedOutletAccount | null>(null);
  const [resetting, setResetting] = useState<ManagedOutletAccount | null>(null);
  const [issued, setIssued] = useState<{ result: CredentialIssueResult; label: string } | null>(
    null,
  );

  function runReset(account: ManagedOutletAccount) {
    reset.mutate(account.id, {
      onSuccess: (result) => {
        setResetting(null);
        setIssued({ result, label: account.digiposId });
      },
      onError: (error) => {
        setResetting(null);
        toast.show({ tone: 'danger', message: `Reset gagal. ${errorsOf(error).message}` });
      },
    });
  }

  return (
    <section aria-labelledby="akun-outlet" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="akun-outlet" className="text-lg font-bold">
            Akun Outlet
          </h2>
          {accounts.data ? <DataNotice meta={accounts.data.meta} /> : null}
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          Tambah akun Outlet
        </Button>
      </div>
      <AsyncView
        state={accounts}
        errorTitle="Daftar akun outlet tidak dapat dimuat"
        loadingLabel="Memuat akun outlet"
      >
        {(envelope) =>
          envelope.data.length === 0 ? (
            <EmptyState
              title="Belum ada akun outlet"
              description="Tambah akun outlet; kata sandi sementara dikirim ke WhatsApp pemiliknya."
            />
          ) : (
            <OutletTable accounts={envelope.data} onEdit={setEditing} onReset={setResetting} />
          )
        }
      </AsyncView>

      <CreateOutletDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(result, label) => {
          setCreating(false);
          setIssued({ result, label });
        }}
      />
      <EditOutletDialog account={editing} onClose={() => setEditing(null)} />
      <ConfirmResetDialog
        target={resetting ? { label: resetting.digiposId, phone: resetting.phone } : null}
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
