/**
 * Reports whether the visitor has asked their operating system for reduced
 * motion.
 *
 * Animation can cause genuine nausea and dizziness for some people, and every
 * major OS offers a setting to say so. Every animated component in this
 * project checks this hook and renders the finished state instead of animating
 * to it.
 *
 * global.css disables transitions as a blunt backstop, but this hook is the
 * proper fix: it lets a component skip the animation entirely rather than
 * running it at zero duration.
 */
import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/** Motion preference, kept live so a mid-session change is honoured. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
