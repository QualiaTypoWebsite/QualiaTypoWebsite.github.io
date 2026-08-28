/**
 * Reports whether a CSS media query currently matches, and keeps reporting as
 * the window changes.
 *
 * Used by the reader to switch the flipbook to single-page mode on narrow
 * screens, where a two-page spread would make the text too small to read.
 */
import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
