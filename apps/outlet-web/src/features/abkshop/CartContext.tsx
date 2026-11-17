import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useOutletSession } from '../../auth/SessionContext';

type Quantities = Record<string, string>;

type CartApi = {
  /** Nilai mentah per id paket, persis seperti yang diketik, supaya input salah bisa ditunjukkan. */
  quantities: Quantities;
  setQuantity: (packageId: string, raw: string) => void;
  clear: () => void;
};

const STORAGE_PREFIX = 'abk-outlet-keranjang-v2:';

const CartContext = createContext<CartApi | null>(null);

function readStored(owner: string | null): Quantities {
  if (!owner) return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_PREFIX + owner);
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
 * Keranjang disimpan di sessionStorage per outlet supaya refresh dan tombol kembali tidak
 * menghapus pilihan, dan pilihan outlet lain di browser yang sama tidak ikut terbawa.
 * Ini bukan order: order dibuat server.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const { session } = useOutletSession();
  const owner = session?.digiposId ?? null;
  const [cart, setCart] = useState(() => ({ owner, quantities: readStored(owner) }));

  // Outlet berganti (masuk, keluar, akun lain): muat keranjang milik outlet itu.
  if (cart.owner !== owner) setCart({ owner, quantities: readStored(owner) });

  useEffect(() => {
    if (!cart.owner) return;
    try {
      window.sessionStorage.setItem(STORAGE_PREFIX + cart.owner, JSON.stringify(cart.quantities));
    } catch {
      // Penyimpanan sesi penuh atau diblokir: keranjang tetap hidup di memori.
    }
  }, [cart]);

  const setQuantity = useCallback((packageId: string, raw: string) => {
    setCart((current) => {
      const next = { ...current.quantities };
      if (raw.trim() === '') delete next[packageId];
      else next[packageId] = raw;
      return { ...current, quantities: next };
    });
  }, []);

  const clear = useCallback(() => setCart((current) => ({ ...current, quantities: {} })), []);

  const api = useMemo(
    () => ({ quantities: cart.quantities, setQuantity, clear }),
    [cart.quantities, setQuantity, clear],
  );

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const api = useContext(CartContext);
  if (!api) throw new Error('useCart harus dipakai di dalam CartProvider.');
  return api;
}
