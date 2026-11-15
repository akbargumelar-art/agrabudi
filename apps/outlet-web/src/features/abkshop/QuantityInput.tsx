import type { OutletPackage } from '@agrabudi/contracts';
import { Minus, Plus } from 'lucide-react';
import { checkQty, stepQty } from './cart-math';

type QuantityInputProps = {
  pkg: OutletPackage;
  raw: string;
  onChange: (raw: string) => void;
};

const stepButtonClass =
  'inline-flex size-11 shrink-0 items-center justify-center text-ink-700 hover:bg-surface-50 disabled:cursor-not-allowed disabled:text-ink-300';

export function QuantityInput({ pkg, raw, onChange }: QuantityInputProps) {
  const check = checkQty(raw, pkg);
  const inputId = `jumlah-${pkg.id}`;
  const errorId = `${inputId}-error`;
  const atMax = pkg.maxQty !== null && check.valid && check.qty >= pkg.maxQty;

  return (
    <div className="flex flex-col gap-1">
      <div
        className={`inline-flex w-fit items-stretch overflow-hidden rounded-control border ${check.valid ? 'border-ink-300' : 'border-danger'}`}
      >
        <button
          type="button"
          className={stepButtonClass}
          aria-label={`Kurangi jumlah ${pkg.name}`}
          disabled={raw.trim() === ''}
          onClick={() => onChange(stepQty(raw, pkg, -1))}
        >
          <Minus aria-hidden className="size-4" />
        </button>
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          aria-label={`Jumlah ${pkg.name}`}
          aria-invalid={!check.valid}
          aria-describedby={check.valid ? undefined : errorId}
          value={raw}
          placeholder="0"
          onChange={(event) => onChange(event.target.value)}
          onFocus={(event) => event.target.scrollIntoView({ block: 'center', behavior: 'smooth' })}
          className="w-14 border-x border-ink-300 bg-surface-0 px-1 text-center text-base text-ink-900 placeholder:text-ink-500"
        />
        <button
          type="button"
          className={stepButtonClass}
          aria-label={`Tambah jumlah ${pkg.name}`}
          disabled={atMax}
          onClick={() => onChange(stepQty(raw, pkg, 1))}
        >
          <Plus aria-hidden className="size-4" />
        </button>
      </div>
      {check.valid ? null : (
        <p id={errorId} role="alert" className="max-w-40 text-xs font-medium text-danger">
          {check.message}
        </p>
      )}
    </div>
  );
}
