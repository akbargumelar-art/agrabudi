import type { LinkProps } from '@agrabudi/ui';
import { Link } from 'react-router';

/** Menyesuaikan Link React Router dengan bentuk link yang dipakai `packages/ui`. */
export function RouterLink({ href, ...rest }: LinkProps) {
  return <Link to={href} {...rest} />;
}
