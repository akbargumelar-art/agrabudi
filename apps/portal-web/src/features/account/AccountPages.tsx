import { Button, PageHeader, cardClass, cn } from '@agrabudi/ui';
import { roleLabel, scopeLabel } from '../../auth/access';
import { useSession, useSessionApi } from '../../auth/SessionContext';

export function AccountPage() {
  const session = useSession();
  const { signOut } = useSessionApi();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Akun"
        description="Peran, unit, dan cakupan data akun yang sedang dipakai."
      />
      <dl className={cn(cardClass, 'grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 p-5 text-sm')}>
        <dt className="text-ink-700">Nama akun</dt>
        <dd className="font-medium">{session.displayName}</dd>
        <dt className="text-ink-700">Peran</dt>
        <dd className="font-medium">{roleLabel(session)}</dd>
        <dt className="text-ink-700">Cakupan data</dt>
        <dd className="font-medium">{scopeLabel(session)}</dd>
        <dt className="text-ink-700">Izin tambahan</dt>
        <dd className="font-medium">
          {session.permissions.length > 0 ? session.permissions.join(', ') : 'Tidak ada'}
        </dd>
      </dl>
      <div>
        <Button variant="secondary" onClick={signOut}>
          Keluar
        </Button>
      </div>
    </div>
  );
}
