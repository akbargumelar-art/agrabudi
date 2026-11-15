import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'inverse' | 'on-dark';
type Size = 'md' | 'sm';

const variantClass: Record<Variant, string> = {
  primary: 'bg-brand-red text-white hover:bg-brand-red-strong disabled:bg-surface-100',
  secondary:
    'border border-ink-300 bg-surface-0 text-ink-900 hover:border-ink-500 disabled:border-surface-100 disabled:bg-surface-50',
  ghost: 'text-ink-700 hover:bg-surface-50 hover:text-ink-900 disabled:bg-transparent',
  /** Tombol utama di atas latar merah atau navy. */
  inverse: 'bg-white text-brand-red-strong hover:bg-brand-red-soft',
  'on-dark': 'border border-white/60 text-white hover:border-white hover:bg-white/10',
};

const sizeClass: Record<Size, string> = {
  md: 'min-h-11 px-6 text-sm',
  sm: 'min-h-9 px-4 text-sm',
};

/** Class tombol, dipakai juga untuk link yang tampil sebagai tombol. */
export function buttonClass(options: { variant?: Variant; size?: Size; block?: boolean } = {}) {
  const { variant = 'primary', size = 'md', block = false } = options;
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap',
    'disabled:cursor-not-allowed disabled:text-ink-500',
    variantClass[variant],
    sizeClass[size],
    block && 'w-full',
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  block?: boolean;
};

export function Button({ variant, size, block, className, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonClass({ variant, size, block }), className)}
      {...rest}
    />
  );
}
