import { staffSessionSchema, type StaffSession } from '@agrabudi/contracts';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type SessionApi = {
  session: StaffSession | null;
  /** Benar setelah pengguna menekan Keluar, supaya akun berikutnya tidak diantar ke halaman akun sebelumnya. */
  leftVoluntarily: boolean;
  signIn: (session: StaffSession) => void;
  signOut: () => void;
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
 * Sesi kerangka disimpan di sessionStorage supaya refresh tidak mengeluarkan pengguna.
 * Ini HANYA untuk tahap kerangka. Sesi sungguhan adalah cookie HttpOnly dari server;
 * role yang disimpan di browser tidak pernah menjadi dasar kewenangan.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StaffSession | null>(readStored);
  const [leftVoluntarily, setLeftVoluntarily] = useState(false);

  const signIn = useCallback((next: StaffSession) => {
    writeStored(next);
    setLeftVoluntarily(false);
    setSession(next);
  }, []);

  const signOut = useCallback(() => {
    writeStored(null);
    setLeftVoluntarily(true);
    setSession(null);
  }, []);

  const api = useMemo(
    () => ({ session, leftVoluntarily, signIn, signOut }),
    [session, leftVoluntarily, signIn, signOut],
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
