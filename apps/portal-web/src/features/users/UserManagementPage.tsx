import { OUTLET_MANAGER_UNIT } from '@agrabudi/contracts';
import { useSession } from '../../auth/SessionContext';
import { OutletAccountsPanel } from './OutletAccountsPanel';
import { StaffAccountsPanel } from './StaffAccountsPanel';

/**
 * Isi menu Admin operasional > User Management. Akses (Admin + izin `user.manage`) sudah
 * diperiksa ModulePage untuk tampilan dan diperiksa lagi oleh server pada setiap permintaan.
 */
export function UserManagementContent() {
  const session = useSession();
  return (
    <div className="flex flex-col gap-10">
      <StaffAccountsPanel />
      {session.unit === OUTLET_MANAGER_UNIT ? <OutletAccountsPanel /> : null}
      <section aria-labelledby="cara-kerja" className="max-w-prose text-sm text-ink-700">
        <h2 id="cara-kerja" className="text-base font-bold text-ink-900">
          Cara kerja kata sandi
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Akun baru dan reset oleh admin: kata sandi acak dikirim ke WhatsApp pemilik akun.</li>
          <li>Saat pertama masuk, pemilik akun wajib membuat kata sandi sendiri.</li>
          <li>
            Pemilik akun juga bisa reset sendiri dari halaman masuk (Lupa kata sandi) dengan kode
            WhatsApp.
          </li>
          <li>Bila WhatsApp gagal dikirim, akun tidak dibuat dan kata sandi lama tidak berubah.</li>
        </ul>
      </section>
    </div>
  );
}
