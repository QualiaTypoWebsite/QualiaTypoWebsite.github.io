/**
 * The audio library — every voiceover recording, grouped by volume.
 *
 * Like the library page, it lists VOLUME_META rather than only the volumes
 * that have recordings, so volume 3 still gets a section: opening it says that
 * nothing has been recorded yet, which is more use to a visitor than a gap
 * where a volume should be.
 *
 * Each section sets --accent to its own cover colour but does not paint with
 * it — the same rule the library rows follow: neutral on screen, with the
 * volume's colour available to any element inside that wants it.
 * See AudioLibrary.module.css.
 *
 * The page only ever asks the player to play something. Everything about what
 * is playing, and the player card itself, lives in src/audio/ and survives
 * leaving this page.
 */
import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './AudioLibrary.module.css';
import { useAudioPlayer } from '../audio/AudioPlayerProvider';
import { PauseIcon, PlayIcon, SoundWaveIcon } from '../audio/PlayerIcons';
import { Button, ButtonLink } from '../components/Button';
import { usePrefersReducedMotion } from '../components/usePrefersReducedMotion';
import { recordingsFor } from '../data/recordings';
import { VOLUME_META } from '../data/volumes';
import { useLang } from '../i18n/LanguageProvider';

/** Page furniture, not a player control, so it is drawn here rather than in PlayerIcons. */
function Chevron() {
  return (
    <svg
      className={styles.chevron}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9.5 6 6 6-6" />
    </svg>
  );
}

function VolumeSection({ volume, accent }: { volume: number; accent: string }) {
  const { t } = useLang();
  const reduced = usePrefersReducedMotion();
  const player = useAudioPlayer();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const recordings = recordingsFor(volume);
  const label = t('library.volumeLabel', { n: volume });

  return (
    <li className={styles.section} style={{ '--accent': accent } as React.CSSProperties}>
      <h2 className={styles.summaryHeading}>
        <button
          type="button"
          className={styles.summary}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={styles.summaryText}>
            <span className={styles.volNumber}>{label}</span>
            <span className={styles.volTitle}>Qualia Typo #{volume}</span>
          </span>
          <span className={styles.count}>
            {recordings.length > 0
              ? t('audio.trackCount', { count: recordings.length })
              : t('audio.none')}
          </span>
          <Chevron />
        </button>
      </h2>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            className={styles.panel}
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.panelInner}>
              {recordings.length === 0 ? (
                <p className={styles.empty}>{t('audio.noRecordings')}</p>
              ) : (
                <>
                  <Button variant="secondary" onClick={() => player.playVolume(volume)}>
                    {t('audio.playFromStart')}
                  </Button>

                  <ol className={styles.tracks}>
                    {recordings.map((recording, i) => {
                      const isCurrent = player.isCurrent(volume, i);
                      const isPlaying = isCurrent && player.playing;

                      return (
                        <li
                          key={recording.alias}
                          className={`${styles.track} ${isCurrent ? styles.trackCurrent : ''}`}
                          aria-current={isCurrent ? 'true' : undefined}
                        >
                          <button
                            type="button"
                            className={styles.trackButton}
                            onClick={() => player.togglePlay(volume, i)}
                            aria-label={
                              isPlaying
                                ? t('audio.pauseTrack', { name: recording.alias })
                                : t('audio.playTrack', { name: recording.alias })
                            }
                          >
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                          </button>
                          <span className={styles.trackIndex}>
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span className={styles.trackName}>{recording.alias}</span>
                          {isPlaying && (
                            <span className={styles.wave}>
                              <SoundWaveIcon />
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export function AudioLibrary() {
  const { t, to } = useLang();

  return (
    <div className={`${styles.page} shell`}>
      <header className={styles.head}>
        <p className="eyebrow">{t('audio.eyebrow')}</p>
        <h1 className={styles.title}>{t('audio.title')}</h1>
        <p className={styles.subtitle}>{t('audio.subtitle')}</p>
        <ButtonLink to={to('/library')} variant="quiet">
          {t('audio.backToLibrary')}
        </ButtonLink>
      </header>

      <ul className={styles.list}>
        {VOLUME_META.map((meta) => (
          <VolumeSection key={meta.volume} volume={meta.volume} accent={meta.accent} />
        ))}
      </ul>
    </div>
  );
}
