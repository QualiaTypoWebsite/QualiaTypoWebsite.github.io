/**
 * Fades and lifts its children into view the first time they are scrolled to.
 *
 * Used for the three homepage sections. The reveal happens once and stays
 * done, so scrolling back up does not replay it — a section that re-animates
 * every time it passes the viewport is distracting to read.
 */
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

type Props = { children: ReactNode; delay?: number; className?: string; id?: string; as?: 'div' | 'section' };

/**
 * Fades and lifts its children the first time they scroll into view. Framer's
 * `once` viewport means a section settles and stays settled rather than
 * re-animating every time the reader scrolls past it.
 */
export function SectionReveal({ children, delay = 0, className, id, as = 'section' }: Props) {
  const reduced = usePrefersReducedMotion();
  const Tag = as === 'section' ? motion.section : motion.div;

  if (reduced) {
    const Plain = as;
    return <Plain id={id} className={className}>{children}</Plain>;
  }

  return (
    <Tag
      id={id}
      className={className}
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Tag>
  );
}
