/**
 * The reading mask and the reading guide.
 *
 * Both help a reader hold their place on a long page, and both work the same
 * way: a fixed overlay that follows the pointer's vertical position.
 *
 *   · The mask dims everything except a band around the pointer, so the line
 *     being read is the only thing lit.
 *   · The guide draws a single ruler line under the pointer, like holding a
 *     sheet of paper under a line of text.
 *
 * They can be on together; the guide then sits inside the mask's clear band.
 *
 * This is the only part of the accessibility panel that watches the pointer,
 * which is why it is its own file rather than more rules in a11y.css.
 *
 * Neither is gated on a media query. An earlier version only rendered them
 * when (any-pointer: fine) matched, and that is a silent-failure waiting to
 * happen: any browser that reports its pointer inaccurately would leave a
 * visitor who had switched the aid on staring at a page where nothing
 * happened. Letting the pointer itself decide is self-correcting — no
 * pointermove, nothing drawn, and a real mouse always works no matter what
 * the media query claims. The panel still warns on a touch-only device.
 */
import { useEffect, useState } from 'react';
import styles from './ReadingAids.module.css';
import { useA11y } from './A11yProvider';

export function ReadingAids() {
  const { settings } = useA11y();
  const [y, setY] = useState<number | null>(null);

  const active = settings.readingMask || settings.readingGuide;

  useEffect(() => {
    if (!active) {
      setY(null);
      return;
    }

    /* pointermove fires far more often than the screen refreshes. Coalescing
       into one animation frame means the overlay is positioned once per
       painted frame instead of once per event, which is the difference
       between this being free and it being the most expensive thing on the
       page while the reader moves the mouse. */
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setY(event.clientY));
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
    };
  }, [active]);

  /* Nothing is drawn until the pointer has actually moved: switching an aid on
     does not slam a band across the middle of the page unprompted, and on a
     touch-only device where no pointer ever moves, nothing appears at all. */
  if (!active || y === null) return null;

  return (
    <>
      {settings.readingMask && (
        <div className={styles.mask} style={{ '--y': `${y}px` } as React.CSSProperties} aria-hidden="true" />
      )}
      {settings.readingGuide && (
        <div className={styles.guide} style={{ '--y': `${y}px` } as React.CSSProperties} aria-hidden="true" />
      )}
    </>
  );
}
