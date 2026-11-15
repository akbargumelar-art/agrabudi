import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type Quantities = Record<string, string>;

type CartApi = {
  /** Nilai mentah per id paket, persis seperti yang diketik, supaya input salah bisa ditunjukkan. */
  quantities: Quantities;
  setQuantity: (packageId: string, raw: string) => void;
  clear: () => void;
};

const STORAGE_KEY = 'abk-outlet-keranjang-v1';

const CartContext = createContext<CartApi | null>(null);

function readStored(): Quantities {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    const result: Quantities = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string') result[key] = value;
    }
    return result;
  } catch {
    // Penyimpanan sesi tidak tersedia atau isinya rusak: mulai dari keranjang kosong.
    return {};
  }
}

/**
 * Keranjang disimpan di sessionStorage supaya refresh dan tombol kembali tidak
 * menghapus pilihan. Ini bukan order: order dibuat server (M4).
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [quantities, setQuantities] = useState<Quantities>(readStored);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(quantities));
    } catch {
      // Penyimpanan sesi penuh atau diblokir: keranjang tetap hidup di memori.
    }
  }, [quantities]);

  const setQuantity = useCallback((packageId: string, raw: string) => {
    setQuantities((current) => {
      const next = { ...current };
      if (raw.trim() === '') delete next[packageId];
      else next[packageId] = raw;
      return next;
    });
  }, []);

  const clear = useCallback(() => setQuantities({}), []);

  const api = useMemo(() => ({ quantities, setQuantity, clear }), [quantities, setQuantity, clear]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const api = useContext(CartContext);
  if (!api) throw new Error('useCart harus dipakai di dalam CartProvider.');
  return api;
}
