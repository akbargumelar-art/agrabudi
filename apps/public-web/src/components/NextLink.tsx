import type { LinkProps } from '@agrabudi/ui';
import Link from 'next/link';

/** Menyesuaikan next/link dengan bentuk link yang dipakai `packages/ui`. */
export function NextLink({ href, ...rest }: LinkProps) {
  return <Link href={href} {...rest} />;
}
