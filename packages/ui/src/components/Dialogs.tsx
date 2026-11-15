'use client';

import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';

type DialogBaseProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

/**
 * Elemen <dialog> bawaan browser: fokus dikurung di dalam, Escape menutup,
 * dan fokus kembali ke pemicu saat ditutup (PRD 2.2).
 */
function useDialog(open: boolean) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return ref;
}

function DialogHeader({
  title,
  titleId,
  onClose,
}: {
  title: string;
  titleId: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-surface-100 px-4 py-2">
      <h2 id={titleId} className="text-base font-bold text-ink-900">
        {title}
      </h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup"
        className="inline-flex size-11 items-center justify-center rounded-control text-ink-700 hover:bg-surface-50"
      >
        <X aria-hidden className="size-5" />
      </button>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: DialogBaseProps & { footer?: ReactNode }) {
  const ref = useDialog(open);
  const titleId = useId();
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-panel bg-surface-0 p-0 text-ink-900 backdrop:bg-ink-900/60"
    >
      <DialogHeader title={title} titleId={titleId} onClose={onClose} />
      <div className="px-4 py-4">{children}</div>
      {footer ? (
        <div className="flex justify-end gap-2 border-t border-surface-100 px-4 py-3">{footer}</div>
      ) : null}
    </dialog>
  );
}

/** Panel geser: dari bawah di smartphone, dari kanan di layar lebar. */
export function Drawer({ open, onClose, title, children }: DialogBaseProps) {
  const ref = useDialog(open);
  const titleId = useId();
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        'bg-surface-0 p-0 text-ink-900 backdrop:bg-ink-900/60',
        'mt-auto mb-0 max-h-[85dvh] w-full max-w-none rounded-t-panel pb-[env(safe-area-inset-bottom)]',
        'tablet:my-0 tablet:mr-0 tablet:ml-auto tablet:h-dvh tablet:max-h-none tablet:w-80 tablet:rounded-none',
      )}
    >
      <DialogHeader title={title} titleId={titleId} onClose={onClose} />
      <div className="overflow-y-auto px-4 py-3">{children}</div>
    </dialog>
  );
}
