/**
 * The magazine reader — the component that turns pages.
 *
 * Read pagination.ts first; it works out which pages face each other, and this
 * file assumes you know that.
 *
 * WHAT IS ON SCREEN
 *
 * Two "boards" side by side, the left and right pages. During a turn a third
 * element is drawn on top of them — the "leaf" — which is the sheet of paper
 * currently in motion. It has a front face and a back face, and rotating it in
 * 3D swaps which one you see:
 *
 *     Before:  [ left 4 ] [ right 5 ]
 *
 *     Turning forward, all at once:
 *       left board   still shows 4
 *       right board  already shows 7, hidden behind the leaf
 *       the leaf     front = 5, back = 6, rotating 0deg -> -180deg
 *
 *     After:   [ left 6 ] [ right 7 ]
 *
 * Past 90 degrees the front face turns away and the back face comes into view,
 * so page 5 appears to lift, flip over, and land as page 6. When the CSS
 * transition finishes, the leaf is removed and the boards move to the new
 * spread.
 *
 * DRAGGING works the same way, except the angle follows your pointer instead
 * of a transition. Release past RELEASE_THRESHOLD and the turn completes;
 * release earlier and it springs back.
 *
 * The parent (Reader.tsx) owns which page is showing. This component asks to
 * change it via onPageChange and is told the result back through the `page`
 * prop, so the URL stays the single source of truth.
 */
import {
  forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState,
} from 'react';
import styles from './Flipbook.module.css';
import { PageImage } from './PageImage';
import { pageImage } from '../data/volumes';
import {
  layoutSpreads, pagesToPreload, spreadIndexIn, type LayoutMode, type Spread,
} from './pagination';

export type FlipbookHandle = {
  next: () => void;
  prev: () => void;
  canNext: boolean;
  canPrev: boolean;
};

type Props = {
  volume: number;
  totalPages: number;
  /** Page width divided by height, used to size the book without reflow. */
  aspect: number;
  page: number;
  onPageChange: (page: number) => void;
  mode: LayoutMode;
  zoom: number;
  labels: { previous: string; next: string; page: string };
};

type Turn = {
  dir: 'next' | 'prev';
  to: number;
  progress: number;
  /** True once the pointer is released and the leaf animates to its resting angle. */
  settling: boolean;
};

/** Past this fraction of a turn, releasing completes the flip instead of undoing it. */
const RELEASE_THRESHOLD = 0.32;

export const Flipbook = forwardRef<FlipbookHandle, Props>(function Flipbook(
  { volume, totalPages, aspect, page, onPageChange, mode, zoom, labels },
  ref,
) {
  const spreads = useMemo(() => layoutSpreads(totalPages, mode), [totalPages, mode]);
  const [index, setIndex] = useState(() => spreadIndexIn(spreads, page));
  const [turn, setTurn] = useState<Turn | null>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; width: number; dir: 'next' | 'prev' } | null>(null);

  // Follow the page prop when it changes from outside (thumbnails, the URL).
  useEffect(() => {
    const target = spreadIndexIn(spreads, page);
    setIndex((prev) => (prev === target ? prev : target));
  }, [page, spreads]);

  const canPrev = index > 0 && !turn;
  const canNext = index < spreads.length - 1 && !turn;

  const commit = useCallback(
    (destination: number) => {
      const spread = spreads[destination];
      setIndex(destination);
      setTurn(null);
      if (spread) onPageChange(spread.left ?? spread.right ?? 1);
    },
    [spreads, onPageChange],
  );

  const start = useCallback(
    (dir: 'next' | 'prev') => {
      if (turn) return;
      const to = dir === 'next' ? index + 1 : index - 1;
      if (to < 0 || to >= spreads.length) return;
      setTurn({ dir, to, progress: 0, settling: true });
      // Two frames: the leaf must paint at 0deg before the transition to 180
      // is applied, or the browser collapses it into no animation at all.
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          setTurn((t) => (t && !t.settling ? t : t && { ...t, progress: 1 })),
        ),
      );
    },
    [index, spreads.length, turn],
  );

  useImperativeHandle(
    ref,
    () => ({ next: () => start('next'), prev: () => start('prev'), canNext, canPrev }),
    [start, canNext, canPrev],
  );

  // Keep the pages around the reader warm so a flip never waits on the network.
  useEffect(() => {
    const inFlight = pagesToPreload(index, totalPages, 2).map((n) => {
      const img = new Image();
      img.src = pageImage(volume, n);
      return img;
    });
    return () => inFlight.forEach((img) => { img.src = ''; });
  }, [index, totalPages, volume]);

  // ── Drag to turn ────────────────────────────────────────────────────────
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (turn || !bookRef.current) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const rect = bookRef.current.getBoundingClientRect();
    const dir = event.clientX - rect.left > rect.width / 2 ? 'next' : 'prev';
    if (dir === 'next' ? index >= spreads.length - 1 : index <= 0) return;
    dragRef.current = { startX: event.clientX, width: rect.width, dir };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const travelled = drag.dir === 'next' ? drag.startX - event.clientX : event.clientX - drag.startX;
    // Half the book is a full turn; ignore the first few pixels so a click
    // does not register as a one-pixel drag.
    const progress = Math.max(0, Math.min(1, (travelled - 4) / (drag.width / 2)));
    if (progress <= 0) return;

    event.currentTarget.setPointerCapture?.(event.pointerId);
    const to = drag.dir === 'next' ? index + 1 : index - 1;
    setTurn({ dir: drag.dir, to, progress, settling: false });
  };

  const endDrag = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;
    setTurn((t) => {
      if (!t || t.settling) return t;
      return { ...t, progress: t.progress >= RELEASE_THRESHOLD ? 1 : 0, settling: true };
    });
  };

  const onLeafTransitionEnd = (event: React.TransitionEvent) => {
    if (event.propertyName !== 'transform' || !turn || !turn.settling) return;
    if (turn.progress >= 1) commit(turn.to);
    else setTurn(null);
  };

  // ── What each surface shows ─────────────────────────────────────────────
  const current: Spread = spreads[index] ?? { left: null, right: null };
  const destination = turn ? spreads[turn.to] : null;
  const single = mode === 'single';

  let leftPage = current.left;
  let rightPage = current.right;
  if (turn?.dir === 'next') rightPage = destination?.right ?? null;
  if (turn?.dir === 'prev') leftPage = destination?.left ?? null;

  const frontPage = turn ? (turn.dir === 'next' ? current.right : current.left) : null;
  const backPage = turn
    ? single
      ? (destination?.right ?? null)
      : turn.dir === 'next'
        ? (destination?.left ?? null)
        : (destination?.right ?? null)
    : null;

  const angle = turn ? (turn.dir === 'next' ? -180 : 180) * turn.progress : 0;
  const lift = turn ? Math.sin(turn.progress * Math.PI) : 0;

  const label = (n: number) => labels.page.replace('{{n}}', String(n));

  return (
    <div
      className={styles.book}
      ref={bookRef}
      style={
        {
          '--book-aspect': single ? aspect : aspect * 2,
          '--book-width': single ? '52vh' : '104vh',
          '--zoom': zoom,
        } as React.CSSProperties
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
    >
      {!single && (
        <div className={`${styles.board} ${styles.left} ${leftPage ? '' : styles.empty}`}>
          {leftPage && <PageImage src={pageImage(volume, leftPage)} alt={label(leftPage)} eager />}
        </div>
      )}

      <div
        className={`${styles.board} ${styles.right} ${single ? styles.single : ''} ${
          rightPage ? '' : styles.empty
        }`}
      >
        {rightPage && <PageImage src={pageImage(volume, rightPage)} alt={label(rightPage)} eager />}
      </div>

      {!single && leftPage && rightPage && <div className={styles.gutter} aria-hidden="true" />}

      {turn && (
        <div
          className={`${styles.leaf} ${styles[turn.dir]} ${turn.settling ? styles.settling : ''} ${
            single ? styles.full : ''
          }`}
          style={{ transform: `rotateY(${angle}deg)` }}
          onTransitionEnd={onLeafTransitionEnd}
          aria-hidden="true"
        >
          <div className={`${styles.face} ${styles.front}`}>
            {frontPage && <PageImage src={pageImage(volume, frontPage)} alt="" eager />}
            <div className={styles.shade} style={{ '--lift': lift } as React.CSSProperties} />
          </div>
          <div className={`${styles.face} ${styles.back}`}>
            {backPage && <PageImage src={pageImage(volume, backPage)} alt="" eager />}
            <div className={styles.shade} style={{ '--lift': lift } as React.CSSProperties} />
          </div>
        </div>
      )}

      <button
        type="button"
        className={`${styles.hit} ${styles.back}`}
        onClick={() => start('prev')}
        disabled={!canPrev}
        aria-label={labels.previous}
      />
      <button
        type="button"
        className={`${styles.hit} ${styles.forward}`}
        onClick={() => start('next')}
        disabled={!canNext}
        aria-label={labels.next}
      />
    </div>
  );
});
