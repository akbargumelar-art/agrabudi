import { outletSessionSchema, type OutletSession } from '@agrabudi/contracts';
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
  session: OutletSession | null;
  /** `checking` selama sesi dari server belum diketahui; halaman berizin menunggu, bukan meminta login. */
  status: 'checking' | 'ready';
  signIn: (session: OutletSession) => void;
  signOut: () => Promise<void>;
};

const STORAGE_KEY = 'abk-outlet-sesi-kerangka-v1';
const SessionContext = createContext<SessionApi | null>(null);

function readStored(): OutletSession | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = outletSessionSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    // Penyimpanan sesi tidak tersedia atau isinya rusak: anggap belum masuk.
    return null;
  }
}

function writeStored(session: OutletSession | null) {
  try {
    if (session) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Penyimpanan sesi diblokir: sesi tetap hidup di memori sampai halaman ditutup.
  }
}

/**
 * Sesi Outlet. Mode `api`: sesi sungguhan adalah cookie HttpOnly dari server; saat halaman
 * dibuka, server ditanya apakah sesi masih berlaku. Mode `mock`: sesi kerangka di
 * sessionStorage, hanya untuk mencoba tampilan.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<OutletSession | null>(() =>
    usesMockData ? readStored() : null,
  );
  const [status, setStatus] = useState<SessionApi['status']>(usesMockData ? 'ready' : 'checking');

  useEffect(() => {
    if (usesMockData) return;
    let active = true;
    getAuthAdapter()
      .then((adapter) => adapter.restore())
      .then((restored) => {
        if (active) setSession(restored);
      })
      .catch(() => {
        // Server tidak terjangkau: perlakukan sebagai belum masuk. Login akan menampilkan gangguannya.
        if (active) setSession(null);
      })
      .finally(() => {
        if (active) setStatus('ready');
      });
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback((next: OutletSession) => {
    if (usesMockData) writeStored(next);
    setSession(next);
  }, []);
  const signOut = useCallback(async () => {
    try {
      await (await getAuthAdapter()).signOut();
    } finally {
      if (usesMockData) writeStored(null);
      setSession(null);
    }
  }, []);

  const api = useMemo(
    () => ({ session, status, signIn, signOut }),
    [session, status, signIn, signOut],
  );
  return <SessionContext.Provider value={api}>{children}</SessionContext.Provider>;
}

export function useOutletSession(): SessionApi {
  const api = useContext(SessionContext);
  if (!api) throw new Error('useOutletSession harus dipakai di dalam SessionProvider.');
  return api;
}
