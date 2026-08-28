/**
 * The reading page: toolbar, flipbook, thumbnail strip.
 *
 * This component owns everything *around* the book — which page is showing,
 * zoom, fullscreen, and the thumbnail drawer. The book itself (Flipbook.tsx)
 * only knows how to turn pages; it is told which page to show and reports back
 * when the reader turns one.
 *
 * The current page lives in the URL as ?page=12, not in React state. That
 * makes a page shareable and survives a refresh. Updates use `replace` so that
 * flipping through 70 pages does not fill the browser history with 70 entries
 * and bury the back button.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import styles from './Reader.module.css';
import { Flipbook, type FlipbookHandle } from '../flipbook/Flipbook';
import { clampPage } from '../flipbook/pagination';
import { useMediaQuery } from '../components/useMediaQuery';
import { pdfHref, thumbImage } from '../data/volumes';
import { useVolumes } from '../data/useVolumes';
import { useLang } from '../i18n/LanguageProvider';

const ZOOM_STEPS = [1, 1.35, 1.75] as const;

export function Reader() {
  const { volume: volumeParam } = useParams();
  const [params, setParams] = useSearchParams();
  const { t, to } = useLang();
  const { volumes, loading } = useVolumes();

  const single = useMediaQuery('(max-width: 900px)');
  const bookRef = useRef<FlipbookHandle>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  const [zoomStep, setZoomStep] = useState(0);
  const [showStrip, setShowStrip] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const volume = useMemo(
    () => volumes.find((v) => String(v.volume) === volumeParam),
    [volumes, volumeParam],
  );

  const page = volume ? clampPage(Number(params.get('page') ?? 1), volume.pages) : 1;

  const setPage = useCallback(
    (next: number) => {
      // replace: flipping through 70 pages should not bury the back button.
      setParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          updated.set('page', String(next));
          return updated;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  // Arrow keys drive the book unless the reader is typing in a field.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.key === 'ArrowRight') bookRef.current?.next();
      else if (event.key === 'ArrowLeft') bookRef.current?.prev();
      else return;
      event.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void shellRef.current?.requestFullscreen().catch(() => undefined);
  };

  if (loading) {
    return <p className={styles.message}>{t('reader.loading')}</p>;
  }

  if (!volume) {
    return (
      <div className={styles.message}>
        <p>{t('reader.notFound')}</p>
        <Link to={to('/library')}>{t('reader.back')}</Link>
      </div>
    );
  }

  const zoom = ZOOM_STEPS[zoomStep];

  return (
    <div
      className={styles.reader}
      ref={shellRef}
      style={{ '--accent': volume.accent } as React.CSSProperties}
    >
      <div className={styles.toolbar}>
        <Link to={to('/library')} className={styles.back}>
          ← <span>{t('reader.back')}</span>
        </Link>

        <button
          type="button"
          className={styles.tool}
          onClick={() => bookRef.current?.prev()}
          aria-label={t('reader.previous')}
        >
          ‹
        </button>
        <span className={styles.counter}>
          {t('reader.pageOf', { current: page, total: volume.pages })}
        </span>
        <button
          type="button"
          className={styles.tool}
          onClick={() => bookRef.current?.next()}
          aria-label={t('reader.next')}
        >
          ›
        </button>

        <button
          type="button"
          className={styles.tool}
          onClick={() => setZoomStep((z) => Math.max(0, z - 1))}
          disabled={zoomStep === 0}
          aria-label={t('reader.zoomOut')}
        >
          −
        </button>
        <button
          type="button"
          className={styles.tool}
          onClick={() => setZoomStep((z) => Math.min(ZOOM_STEPS.length - 1, z + 1))}
          disabled={zoomStep === ZOOM_STEPS.length - 1}
          aria-label={t('reader.zoomIn')}
        >
          +
        </button>

        <button
          type="button"
          className={`${styles.tool} ${showStrip ? styles.on : ''}`}
          onClick={() => setShowStrip((v) => !v)}
          aria-pressed={showStrip}
          aria-label={t('reader.toggleThumbnails')}
        >
          ▤
        </button>
        <button
          type="button"
          className={styles.tool}
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? t('reader.exitFullscreen') : t('reader.fullscreen')}
        >
          ⛶
        </button>
        <a
          className={styles.tool}
          href={pdfHref(volume)}
          download
          aria-label={t('reader.download')}
        >
          ↓
        </a>
      </div>

      <div className={styles.stage}>
        <Flipbook
          ref={bookRef}
          volume={volume.volume}
          totalPages={volume.pages}
          aspect={volume.width / volume.height}
          page={page}
          onPageChange={setPage}
          mode={single ? 'single' : 'double'}
          zoom={zoom}
          labels={{
            previous: t('reader.previous'),
            next: t('reader.next'),
            page: t('reader.pageOf', { current: '{{n}}', total: volume.pages }),
          }}
        />
      </div>

      <p className={styles.hint}>{t('reader.hint')}</p>

      {showStrip && (
        <div className={styles.strip} aria-label={t('reader.thumbnails')}>
          {Array.from({ length: volume.pages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              className={`${styles.thumb} ${n === page ? styles.current : ''}`}
              onClick={() => setPage(n)}
              aria-label={t('reader.pageOf', { current: n, total: volume.pages })}
              aria-current={n === page || undefined}
            >
              <img src={thumbImage(volume.volume, n)} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
