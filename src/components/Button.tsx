/**
 * One button design, in three variants and three HTML elements.
 *
 * The variants: `primary` (filled, for the main action), `secondary`
 * (outlined), and `quiet` (small and grey, for things like Download).
 *
 * The three exports exist because a button that navigates should not be a
 * <button>: use ButtonLink for internal routes, ButtonAnchor for external
 * links and downloads, and Button for real actions like submitting a form.
 * They look identical and behave correctly for keyboards and screen readers.
 */
import { Link } from 'react-router-dom';
import type { ComponentProps, ReactNode } from 'react';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'quiet';

type Common = { variant?: Variant; children: ReactNode; className?: string };

export function ButtonLink({
  to, variant = 'primary', children, className = '', ...rest
}: Common & { to: string } & Omit<ComponentProps<typeof Link>, 'to' | 'className'>) {
  return (
    <Link to={to} className={`${styles.base} ${styles[variant]} ${className}`} {...rest}>
      {children}
    </Link>
  );
}

export function ButtonAnchor({
  variant = 'primary', children, className = '', ...rest
}: Common & ComponentProps<'a'>) {
  return (
    <a className={`${styles.base} ${styles[variant]} ${className}`} {...rest}>
      {children}
    </a>
  );
}

export function Button({
  variant = 'primary', children, className = '', ...rest
}: Common & ComponentProps<'button'>) {
  return (
    <button className={`${styles.base} ${styles[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
