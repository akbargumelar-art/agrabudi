import { staffSessionSchema, type StaffSession } from '@agrabudi/contracts';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usesMockData } from '../app/env';
import { getAuthAdapter } from './index';

type SessionApi = {
  session: StaffSession | null;
  /** `checking` selama sesi dari server belum diketahui. */
  status: 'checking' | 'ready';
  /** Benar setelah pengguna menekan Keluar, supaya akun berikutnya tidak diantar ke halaman akun sebelumnya. */
  leftVoluntarily: boolean;
  signIn: (session: StaffSession) => void;
  signOut: () => Promise<void>;
};

const STORAGE_KEY = 'abk-portal-sesi-kerangka-v1';

const SessionContext = createContext<SessionApi | null>(null);

function readStored(): StaffSession | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = staffSessionSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    // Penyimpanan sesi tidak tersedia atau isinya rusak: anggap belum masuk.
    return null;
  }
}

function writeStored(session: StaffSession | null) {
  try {
    if (session) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Penyimpanan sesi diblokir: sesi tetap hidup di memori sampai halaman ditutup.
  }
}

/**
 * Sesi Portal. Mode `api`: cookie HttpOnly dari server; saat halaman dibuka, server ditanya
 * apakah sesi (staff atau Admin Web) masih berlaku. Peran di memori browser hanya untuk
 * menyusun menu; keputusan akses tetap di server. Mode `mock`: sesi kerangka di sessionStorage.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StaffSession | null>(() =>
    usesMockData ? readStored() : null,
  );
  const [status, setStatus] = useState<SessionApi['status']>(usesMockData ? 'ready' : 'checking');
  const [leftVoluntarily, setLeftVoluntarily] = useState(false);

  useEffect(() => {
    if (usesMockData) return;
    let active = true;
    getAuthAdapter()
      .then((adapter) => adapter.restore())
      .then((restored) => {
        if (active) setSession(restored);
      })
      .catch(() => {
        // Server tidak terjangkau: tampilkan login; pesan gangguan muncul saat mencoba masuk.
        if (active) setSession(null);
      })
      .finally(() => {
        if (active) setStatus('ready');
      });
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback((next: StaffSession) => {
    if (usesMockData) writeStored(next);
    setLeftVoluntarily(false);
    setSession(next);
  }, []);

  const signOut = useCallback(async () => {
    const current = session;
    try {
      if (current) await (await getAuthAdapter()).signOut(current);
    } finally {
      if (usesMockData) writeStored(null);
      setLeftVoluntarily(true);
      setSession(null);
    }
  }, [session]);

  const api = useMemo(
    () => ({ session, status, leftVoluntarily, signIn, signOut }),
    [session, status, leftVoluntarily, signIn, signOut],
  );
  return <SessionContext.Provider value={api}>{children}</SessionContext.Provider>;
}

export function useSessionApi(): SessionApi {
  const api = useContext(SessionContext);
  if (!api) throw new Error('useSessionApi harus dipakai di dalam SessionProvider.');
  return api;
}

/** Sesi untuk halaman di balik login. Melempar bila dipakai di luar RequireSession. */
export function useSession(): StaffSession {
  const { session } = useSessionApi();
  if (!session) throw new Error('Halaman ini hanya boleh dirender setelah login.');
  return session;
}
