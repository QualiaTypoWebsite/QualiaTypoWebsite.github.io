/**
 * The player itself: a small card fixed to the bottom-left corner.
 *
 * It renders nothing at all until the first recording is chosen, so a visitor
 * who never presses play never sees it. It is mounted in the app shell rather
 * than on the audio page, because playback outlives the page — see
 * AudioPlayerProvider.
 *
 * The card takes the colour of the volume being played, which is the same rule
 * the rest of the site follows: saturated cover colours belong to the
 * magazines, and appear only on something belonging to that volume.
 *
 * Every control is icon-only and so carries a label from the i18n files. The
 * seek bar is a real <input type="range">, which means keyboard seeking with
 * the arrow keys comes for free and is announced properly.
 */
import { AnimatePresence, motion } from 'framer-motion';
import styles from './AudioPlayer.module.css';
import { useAudioPlayer } from './AudioPlayerProvider';
import {
  Back5Icon,
  CloseIcon,
  Forward5Icon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PreviousIcon,
} from './PlayerIcons';
import { formatTime } from './queue';
import { usePrefersReducedMotion } from '../components/usePrefersReducedMotion';
import { accentFor } from '../data/volumes';
import { useLang } from '../i18n/LanguageProvider';

export function AudioPlayer() {
  const { t } = useLang();
  const reduced = usePrefersReducedMotion();
  const {
    current, playing, currentTime, duration,
    toggle, skip, seekTo, next, previous, hasNext, hasPrevious, close,
  } = useAudioPlayer();

  // The duration is NaN until the file's metadata arrives; until then the bar
  // has nothing to scrub along, so it is shown empty and disabled.
  const known = Number.isFinite(duration) && duration > 0;
  const progress = known ? Math.min(currentTime / duration, 1) : 0;

  return (
    <AnimatePresence>
      {current && (
        <motion.aside
          className={styles.player}
          style={{ '--accent': accentFor(current.volume) } as React.CSSProperties}
          aria-label={t('audio.player.region')}
          initial={reduced ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.head}>
            <p className={styles.eyebrow}>{t('audio.player.nowPlaying')}</p>
            <button
              type="button"
              className={styles.close}
              onClick={close}
              aria-label={t('audio.player.close')}
            >
              <CloseIcon />
            </button>
          </div>

          {/* aria-live so a screen reader hears the title change on auto-advance. */}
          <p className={styles.title} aria-live="polite">
            {current.recording.alias}
          </p>

          <div className={styles.scrub}>
            <span className={styles.time}>{formatTime(currentTime)}</span>
            <input
              type="range"
              className={styles.range}
              min={0}
              max={known ? duration : 0}
              step={0.1}
              value={known ? currentTime : 0}
              disabled={!known}
              onChange={(e) => seekTo(Number(e.currentTarget.value))}
              aria-label={t('audio.player.progress')}
              aria-valuetext={t('audio.player.elapsed', {
                current: formatTime(currentTime),
                total: formatTime(duration),
              })}
              style={{ '--progress': `${progress * 100}%` } as React.CSSProperties}
            />
            <span className={styles.time}>{known ? formatTime(duration) : '–:––'}</span>
          </div>

          <div className={styles.controls}>
            <button
              type="button"
              className={styles.control}
              onClick={previous}
              disabled={!hasPrevious}
              aria-label={t('audio.player.previous')}
            >
              <PreviousIcon />
            </button>
            <button
              type="button"
              className={styles.control}
              onClick={() => skip(-5)}
              aria-label={t('audio.player.back5')}
            >
              <Back5Icon />
            </button>
            <button
              type="button"
              className={`${styles.control} ${styles.big}`}
              onClick={toggle}
              aria-label={playing ? t('audio.player.pause') : t('audio.player.play')}
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button
              type="button"
              className={styles.control}
              onClick={() => skip(5)}
              aria-label={t('audio.player.forward5')}
            >
              <Forward5Icon />
            </button>
            <button
              type="button"
              className={styles.control}
              onClick={next}
              disabled={!hasNext}
              aria-label={t('audio.player.next')}
            >
              <NextIcon />
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
