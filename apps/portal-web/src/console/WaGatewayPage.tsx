import {
  waNotificationSettingsSchema,
  type WaGatewayStatus,
  type WaNotificationSettings,
} from '@agrabudi/contracts';
import {
  AsyncView,
  Button,
  DataNotice,
  PageHeader,
  StatusBadge,
  cardClass,
  cn,
  useToast,
} from '@agrabudi/ui';
import { useEffect, useState, type FormEvent } from 'react';
import type { WaTestTarget } from './data/adapter';
import { useSaveWaGateway, useTestWaGateway, useWaGateway } from './data/queries';
import { fieldErrors } from './editors';
import { WaGroupField } from './WaGroupField';

const groups: { key: WaTestTarget; label: string; hint: string }[] = [
  {
    key: 'orderGroup',
    label: 'Grup pesanan ABKShop Outlet',
    hint: 'Menerima nomor order dan total setiap order baru.',
  },
  {
    key: 'careerGroup',
    label: 'Grup lamaran kerja',
    hint: 'Menerima nomor referensi lamaran baru, tanpa data pelamar.',
  },
  {
    key: 'digiposGroup',
    label: 'Grup pendaftaran Digipos',
    hint: 'Menerima nomor referensi pendaftaran baru, tanpa data pendaftar.',
  },
];

/**
 * Pengaturan notifikasi WhatsApp lewat WAHA. Alamat server dan kunci API WAHA diatur
 * pengelola teknis di environment server, tidak pernah lewat browser.
 */
export function WaGatewayPage() {
  const status = useWaGateway();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="WA Gateway"
        description="Notifikasi WhatsApp lewat WAHA untuk pesanan, lamaran, dan pendaftaran Digipos."
        aside={status.data ? <DataNotice meta={status.data.meta} /> : null}
      />
      <AsyncView
        state={status}
        errorTitle="Pengaturan WA Gateway tidak dapat dimuat"
        loadingLabel="Memuat pengaturan"
      >
        {(envelope) => <WaGatewayForm status={envelope.data} />}
      </AsyncView>
    </div>
  );
}

const blank = (value: string | null) => value?.trim() || null;

function WaGatewayForm({ status }: { status: WaGatewayStatus }) {
  const save = useSaveWaGateway();
  const test = useTestWaGateway();
  const toast = useToast();
  const [draft, setDraft] = useState<WaNotificationSettings>(status.notifications);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => setDraft(status.notifications), [status.notifications]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(status.notifications);

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = waNotificationSettingsSchema.safeParse({
      ...draft,
      orderGroup: blank(draft.orderGroup),
      careerGroup: blank(draft.careerGroup),
      digiposGroup: blank(draft.digiposGroup),
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    save.mutate(parsed.data, {
      onSuccess: () => toast.show({ tone: 'success', message: 'Pengaturan WA Gateway disimpan.' }),
      onError: (error) =>
        toast.show({ tone: 'danger', message: `Gagal menyimpan. ${error.message}` }),
    });
  }

  function sendTest(target: WaTestTarget, label: string) {
    test.mutate(target, {
      onSuccess: () => toast.show({ tone: 'success', message: `Pesan uji terkirim ke ${label}.` }),
      onError: (error) =>
        toast.show({ tone: 'danger', message: `Pesan uji gagal. ${error.message}` }),
    });
  }

  const testBlocked = !status.configured
    ? 'WAHA belum dikonfigurasi di server.'
    : dirty
      ? 'simpan perubahan dulu.'
      : null;

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-6">
      <section aria-labelledby="wa-koneksi" className={cn(cardClass, 'flex flex-col gap-2 p-4')}>
        <h2 id="wa-koneksi" className="text-base font-bold">
          Koneksi WAHA
        </h2>
        <div>
          {status.configured ? (
            <StatusBadge tone="success">Terkonfigurasi di server</StatusBadge>
          ) : (
            <StatusBadge tone="warning">Belum dikonfigurasi</StatusBadge>
          )}
        </div>
        <p className="max-w-prose text-sm text-ink-700">
          {status.configured
            ? 'Alamat dan kunci WAHA diatur pengelola teknis di server. Pengaturan di bawah menentukan penerima notifikasi.'
            : 'Notifikasi tidak dikirim sampai pengelola teknis mengisi alamat dan kunci WAHA di server. Pengaturan tetap bisa disimpan.'}
        </p>
      </section>

      <fieldset className={cn(cardClass, 'flex min-w-0 flex-col gap-4 p-4')}>
        <legend className="px-1 text-base font-bold">Grup penerima</legend>
        <p className="max-w-prose text-sm text-ink-700">
          Isi ID grup WhatsApp dari WAHA (berakhiran @g.us). Kosongkan untuk mematikan notifikasi
          grup itu.
        </p>
        {groups.map((group) => (
          <WaGroupField
            key={group.key}
            id={`wa-${group.key}`}
            label={group.label}
            hint={group.hint}
            value={draft[group.key] ?? ''}
            error={errors[group.key]}
            onChange={(value) => setDraft({ ...draft, [group.key]: value })}
            testDisabled={
              testBlocked !== null || !status.notifications[group.key] || test.isPending
            }
            onTest={() => sendTest(group.key, group.label)}
          />
        ))}
        {testBlocked ? (
          <p className="text-sm text-ink-700">Pesan uji belum bisa dikirim: {testBlocked}</p>
        ) : null}
      </fieldset>

      <fieldset className={cn(cardClass, 'flex flex-col gap-2 p-4')}>
        <legend className="px-1 text-base font-bold">Notifikasi ke outlet</legend>
        <label className="inline-flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="size-5 accent-brand-red"
            checked={draft.orderCustomer}
            onChange={(event) => setDraft({ ...draft, orderCustomer: event.target.checked })}
          />
          Kirim konfirmasi order ke nomor HP outlet yang memesan
        </label>
        <p className="max-w-prose text-sm text-ink-700">
          Pesan berisi nomor order, status Diajukan, dan total. Outlet tanpa nomor HP yang sah
          dilewati.
        </p>
      </fieldset>

      <div>
        <Button type="submit" disabled={!dirty || save.isPending}>
          {save.isPending ? 'Menyimpan…' : 'Simpan pengaturan'}
        </Button>
      </div>
    </form>
  );
}
