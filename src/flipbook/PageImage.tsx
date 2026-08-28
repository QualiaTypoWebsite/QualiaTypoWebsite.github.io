/**
 * A single magazine page.
 *
 * Shows a paper-toned shimmer until the image has actually decoded, so a page
 * that is still downloading looks like it is loading rather than like a
 * mistake. Used for both the static boards and the two faces of the turning
 * leaf.
 */
import { useEffect, useState } from 'react';
import styles from './Flipbook.module.css';

type Props = { src: string; alt: string; eager?: boolean };

/** A page that shows a paper-toned shimmer until its image has decoded. */
export function PageImage({ src, alt, eager = false }: Props) {
  const [loaded, setLoaded] = useState(false);

  // A new src means a different page in the same slot, so reset the placeholder.
  useEffect(() => setLoaded(false), [src]);

  return (
    <>
      {!loaded && <div className={styles.placeholder} aria-hidden="true" />}
      <img
        src={src}
        alt={alt}
        draggable={false}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.25s ease' }}
      />
    </>
  );
}
