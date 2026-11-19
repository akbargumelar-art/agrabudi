import {
  createStaffAccountSchema,
  manageableStaffRoleSchema,
  updateStaffAccountSchema,
  type BusinessUnit,
  type CredentialIssueResult,
  type ManagedStaffAccount,
  type StaffPermission,
} from '@agrabudi/contracts';
import { Button, ErrorState, Field, Input, Modal, Select, useToast } from '@agrabudi/ui';
import { useState, type FormEvent } from 'react';
import { useCreateStaff, useUpdateStaff } from './queries';
import { errorsOf, zodErrors, type Errors } from './shared';
import { permissionLabel, unitLabel } from './StaffTable';

const roleOptions: { value: string; label: string }[] = [
  { value: 'salesforce', label: 'Salesforce' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'admin', label: 'Admin' },
];

/** Tambah akun Portal. Tidak ada kolom kata sandi: server membuatnya dan mengirim ke WhatsApp. */
export function CreateStaffDialog({
  open,
  units,
  grantable,
  onClose,
  onCreated,
}: {
  open: boolean;
  units: readonly BusinessUnit[];
  grantable: StaffPermission[];
  onClose: () => void;
  onCreated: (result: CredentialIssueResult, label: string) => void;
}) {
  const create = useCreateStaff();
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [role, setRole] = useState('salesforce');

  function close() {
    setErrors({});
    setFailure(null);
    setRole('salesforce');
    onClose();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = createStaffAccountSchema.safeParse({
      username: String(form.get('username') ?? ''),
      displayName: String(form.get('displayName') ?? ''),
      phone: String(form.get('phone') ?? ''),
      role: String(form.get('role') ?? ''),
      unit: String(form.get('unit') ?? ''),
      permissions: role === 'admin' ? form.getAll('permissions').map(String) : [],
    });
    if (!parsed.success) {
      setErrors(zodErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    setFailure(null);
    create.mutate(parsed.data, {
      onSuccess: (result) => {
        setRole('salesforce');
        onCreated(result, parsed.data.username);
      },
      onError: (cause) => {
        const { message, fields } = errorsOf(cause);
        setErrors(fields);
        setFailure(Object.keys(fields).length === 0 ? message : null);
      },
    });
  }

  return (
    <Modal open={open} onClose={close} title="Tambah akun Portal">
      <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
        <Field label="Nama lengkap" htmlFor="akun-nama" error={errors.displayName}>
          <Input id="akun-nama" name="displayName" autoComplete="off" />
        </Field>
        <Field
          label="Username"
          htmlFor="akun-username"
          hint="Huruf kecil, angka, titik, - atau _. Tidak bisa diubah."
          error={errors.username}
        >
          <Input id="akun-username" name="username" autoCapitalize="none" autoComplete="off" />
        </Field>
        <Field
          label="Nomor WhatsApp"
          htmlFor="akun-hp"
          hint="Kata sandi sementara dikirim ke nomor ini."
          error={errors.phone}
        >
          <Input id="akun-hp" name="phone" type="tel" inputMode="tel" autoComplete="off" />
        </Field>
        <Field label="Peran" htmlFor="akun-peran" error={errors.role}>
          <Select
            id="akun-peran"
            name="role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            {roleOptions
              .filter((option) => manageableStaffRoleSchema.safeParse(option.value).success)
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </Select>
        </Field>
        <Field label="Unit" htmlFor="akun-unit" error={errors.unit}>
          <Select id="akun-unit" name="unit">
            {units.map((unit) => (
              <option key={unit} value={unit}>
                {unitLabel[unit]}
              </option>
            ))}
          </Select>
        </Field>
        {role === 'admin' && grantable.length > 0 ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Izin tambahan</legend>
            {grantable.map((permission) => (
              <label key={permission} className="inline-flex min-h-11 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  name="permissions"
                  value={permission}
                  className="size-5 accent-brand-red"
                />
                {permissionLabel[permission]}
              </label>
            ))}
            {errors.permissions ? (
              <p role="alert" className="text-sm font-medium text-danger">
                {errors.permissions}
              </p>
            ) : null}
          </fieldset>
        ) : null}
        {failure ? <ErrorState title="Akun belum dibuat" description={failure} /> : null}
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={close}>
            Batal
          </Button>
          <Button size="sm" type="submit" disabled={create.isPending}>
            {create.isPending ? 'Membuat…' : 'Buat dan kirim ke WhatsApp'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** Ubah nama, nomor WhatsApp, dan status. Username, peran, dan unit tetap (buat akun baru bila berubah). */
export function EditStaffDialog({
  account,
  onClose,
}: {
  account: ManagedStaffAccount | null;
  onClose: () => void;
}) {
  const update = useUpdateStaff();
  const toast = useToast();
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState<string | null>(null);

  function close() {
    setErrors({});
    setFailure(null);
    onClose();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account) return;
    const form = new FormData(event.currentTarget);
    const parsed = updateStaffAccountSchema.safeParse({
      displayName: String(form.get('displayName') ?? ''),
      phone: String(form.get('phone') ?? ''),
      status: String(form.get('status') ?? ''),
    });
    if (!parsed.success) {
      setErrors(zodErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    setFailure(null);
    update.mutate(
      { id: account.id, data: parsed.data },
      {
        onSuccess: () => {
          toast.show({ tone: 'success', message: `Akun ${account.username} disimpan.` });
          close();
        },
        onError: (cause) => {
          const { message, fields } = errorsOf(cause);
          setErrors(fields);
          setFailure(Object.keys(fields).length === 0 ? message : null);
        },
      },
    );
  }

  return (
    <Modal open={account !== null} onClose={close} title={`Ubah akun ${account?.username ?? ''}`}>
      {account ? (
        <form key={account.id} className="flex flex-col gap-4" onSubmit={submit} noValidate>
          <Field label="Nama lengkap" htmlFor="ubah-nama" error={errors.displayName}>
            <Input id="ubah-nama" name="displayName" defaultValue={account.displayName} />
          </Field>
          <Field label="Nomor WhatsApp" htmlFor="ubah-hp" error={errors.phone}>
            <Input
              id="ubah-hp"
              name="phone"
              type="tel"
              inputMode="tel"
              defaultValue={account.phone ?? ''}
            />
          </Field>
          <Field
            label="Status"
            htmlFor="ubah-status"
            hint="Menonaktifkan akun langsung mengeluarkan semua sesinya."
            error={errors.status}
          >
            <Select id="ubah-status" name="status" defaultValue={account.status}>
              <option value="active">Aktif</option>
              <option value="disabled">Nonaktif</option>
            </Select>
          </Field>
          {failure ? <ErrorState title="Perubahan belum disimpan" description={failure} /> : null}
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={close}>
              Batal
            </Button>
            <Button size="sm" type="submit" disabled={update.isPending}>
              {update.isPending ? 'Menyimpan…' : 'Simpan'}
            </Button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}

