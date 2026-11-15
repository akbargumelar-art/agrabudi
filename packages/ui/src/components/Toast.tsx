'use client';

import { X } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { StatusIcon, type StatusTone } from './Status';

type ToastMessage = { id: number; tone: StatusTone; message: string };

type ToastApi = { show: (toast: { tone: StatusTone; message: string }) => void };

const ToastContext = createContext<ToastApi | null>(null);

const AUTO_DISMISS_MS = 6000;

/**
 * Toast hanya untuk mengabarkan perubahan yang benar-benar terjadi.
 * Jangan dipakai sebagai pengganti aksi yang belum ada (PRD AS-09).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback<ToastApi['show']>(
    ({ tone, message }) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, tone, message }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 tablet:inset-x-auto tablet:right-6 tablet:bottom-6 tablet:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-control bg-ink-900 py-1 pr-1 pl-4 text-sm text-white"
          >
            <StatusIcon tone={toast.tone} className="size-5 shrink-0" />
            <p className="flex-1 py-2">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Tutup pemberitahuan"
              className="on-dark inline-flex size-11 shrink-0 items-center justify-center rounded-control hover:bg-ink-800"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast harus dipakai di dalam ToastProvider.');
  return api;
}
