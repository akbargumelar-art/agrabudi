import {
  createOutletAccountSchema,
  updateOutletAccountSchema,
  type CredentialIssueResult,
  type ManagedOutletAccount,
} from '@agrabudi/contracts';
import { Button, ErrorState, Field, Input, Modal, Select, useToast } from '@agrabudi/ui';
import { useState, type FormEvent } from 'react';
import { useCreateOutlet, useUpdateOutlet } from './queries';
import { errorsOf, zodErrors, type Errors } from './shared';

const text = (form: FormData, key: string) => String(form.get(key) ?? '');
const optional = (value: string) => (value.trim() === '' ? null : value);

function useFormState() {
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const fail = (cause: unknown) => {
    const { message, fields } = errorsOf(cause);
    setErrors(fields);
    setFailure(Object.keys(fields).length === 0 ? message : null);
  };
  const clear = () => {
    setErrors({});
    setFailure(null);
  };
  return { errors, setErrors, failure, fail, clear };
}

function DialogActions({
  busy,
  label,
  onCancel,
}: {
  busy: boolean;
  label: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" variant="secondary" onClick={onCancel}>
        Batal
      </Button>
      <Button size="sm" type="submit" disabled={busy}>
        {busy ? 'Menyimpan…' : label}
      </Button>
    </div>
  );
}

export function CreateOutletDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (result: CredentialIssueResult, label: string) => void;
}) {
  const create = useCreateOutlet();
  const state = useFormState();
  const close = () => {
    state.clear();
    onClose();
  };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = createOutletAccountSchema.safeParse({
      digiposId: text(form, 'digiposId'),
      outletName: text(form, 'outletName'),
      ownerName: text(form, 'ownerName'),
      tap: optional(text(form, 'tap')),
      phone: text(form, 'phone'),
      registeredAt: text(form, 'registeredAt'),
    });
    if (!parsed.success) {
      state.setErrors(zodErrors(parsed.error.issues));
      return;
    }
    state.clear();
    create.mutate(parsed.data, {
      onSuccess: (result) => onCreated(result, parsed.data.digiposId),
      onError: state.fail,
    });
  }

  const { errors } = state;
  return (
    <Modal open={open} onClose={close} title="Tambah akun Outlet">
      <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
        <Field
          label="ID Digipos"
          htmlFor="outlet-id"
          hint="Dipakai untuk login."
          error={errors.digiposId}
        >
          <Input id="outlet-id" name="digiposId" autoCapitalize="characters" autoComplete="off" />
        </Field>
        <Field label="Nama outlet" htmlFor="outlet-nama" error={errors.outletName}>
          <Input id="outlet-nama" name="outletName" autoComplete="off" />
        </Field>
        <Field label="Nama pemilik" htmlFor="outlet-pemilik" error={errors.ownerName}>
          <Input id="outlet-pemilik" name="ownerName" autoComplete="off" />
        </Field>
        <Field label="TAP (opsional)" htmlFor="outlet-tap" error={errors.tap}>
          <Input id="outlet-tap" name="tap" autoComplete="off" />
        </Field>
        <Field
          label="Nomor WhatsApp pemilik"
          htmlFor="outlet-hp"
          hint="Kata sandi sementara dikirim ke nomor ini."
          error={errors.phone}
        >
          <Input id="outlet-hp" name="phone" type="tel" inputMode="tel" autoComplete="off" />
        </Field>
        <Field label="Tanggal terdaftar" htmlFor="outlet-tanggal" error={errors.registeredAt}>
          <Input id="outlet-tanggal" name="registeredAt" type="date" />
        </Field>
        {state.failure ? (
          <ErrorState title="Akun belum dibuat" description={state.failure} />
        ) : null}
        <DialogActions
          busy={create.isPending}
          label="Buat dan kirim ke WhatsApp"
          onCancel={close}
        />
      </form>
    </Modal>
  );
}

/** Ubah data outlet dan status. ID Digipos tetap (dipakai login dan riwayat order). */
export function EditOutletDialog({
  account,
  onClose,
}: {
  account: ManagedOutletAccount | null;
  onClose: () => void;
}) {
  const update = useUpdateOutlet();
  const toast = useToast();
  const state = useFormState();
  const close = () => {
    state.clear();
    onClose();
  };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account) return;
    const form = new FormData(event.currentTarget);
    const parsed = updateOutletAccountSchema.safeParse({
      outletName: text(form, 'outletName'),
      ownerName: text(form, 'ownerName'),
      tap: optional(text(form, 'tap')),
      phone: text(form, 'phone'),
      status: text(form, 'status'),
    });
    if (!parsed.success) {
      state.setErrors(zodErrors(parsed.error.issues));
      return;
    }
    state.clear();
    update.mutate(
      { id: account.id, data: parsed.data },
      {
        onSuccess: () => {
          toast.show({ tone: 'success', message: `Akun outlet ${account.digiposId} disimpan.` });
          close();
        },
        onError: state.fail,
      },
    );
  }

  const { errors } = state;
  return (
    <Modal
      open={account !== null}
      onClose={close}
      title={`Ubah outlet ${account?.digiposId ?? ''}`}
    >
      {account ? (
        <form key={account.id} className="flex flex-col gap-4" onSubmit={submit} noValidate>
          <Field label="Nama outlet" htmlFor="ubah-outlet-nama" error={errors.outletName}>
            <Input id="ubah-outlet-nama" name="outletName" defaultValue={account.outletName} />
          </Field>
          <Field label="Nama pemilik" htmlFor="ubah-outlet-pemilik" error={errors.ownerName}>
            <Input id="ubah-outlet-pemilik" name="ownerName" defaultValue={account.ownerName} />
          </Field>
          <Field label="TAP (opsional)" htmlFor="ubah-outlet-tap" error={errors.tap}>
            <Input id="ubah-outlet-tap" name="tap" defaultValue={account.tap ?? ''} />
          </Field>
          <Field label="Nomor WhatsApp pemilik" htmlFor="ubah-outlet-hp" error={errors.phone}>
            <Input
              id="ubah-outlet-hp"
              name="phone"
              type="tel"
              inputMode="tel"
              defaultValue={account.phone}
            />
          </Field>
          <Field
            label="Status"
            htmlFor="ubah-outlet-status"
            hint="Menonaktifkan akun langsung mengeluarkan semua sesinya."
            error={errors.status}
          >
            <Select id="ubah-outlet-status" name="status" defaultValue={account.status}>
              <option value="active">Aktif</option>
              <option value="disabled">Nonaktif</option>
            </Select>
          </Field>
          {state.failure ? (
            <ErrorState title="Perubahan belum disimpan" description={state.failure} />
          ) : null}
          <DialogActions busy={update.isPending} label="Simpan" onCancel={close} />
        </form>
      ) : null}
    </Modal>
  );
}

