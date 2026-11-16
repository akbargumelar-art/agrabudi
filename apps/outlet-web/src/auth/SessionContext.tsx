import { outletSessionSchema, type OutletSession } from '@agrabudi/contracts';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type SessionApi = {
  session: OutletSession | null;
  signIn: (session: OutletSession) => void;
  signOut: () => void;
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

/** Sesi kerangka di browser. Sesi sungguhan adalah cookie HttpOnly dari server. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<OutletSession | null>(readStored);

  const signIn = useCallback((next: OutletSession) => {
    writeStored(next);
    setSession(next);
  }, []);
  const signOut = useCallback(() => {
    writeStored(null);
    setSession(null);
  }, []);

  const api = useMemo(() => ({ session, signIn, signOut }), [session, signIn, signOut]);
  return <SessionContext.Provider value={api}>{children}</SessionContext.Provider>;
}

export function useOutletSession(): SessionApi {
  const api = useContext(SessionContext);
  if (!api) throw new Error('useOutletSession harus dipakai di dalam SessionProvider.');
  return api;
}
