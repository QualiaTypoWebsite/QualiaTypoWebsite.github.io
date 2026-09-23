/**
 * The 2x2 grid of magazine covers on the homepage.
 *
 * Renders one tile per *planned* volume, not per published one, so volume 4
 * appears as a striped "coming soon" tile until its PDF is added. A cover is
 * simply page 1 of that volume's rendered images.
 *
 * The hover lift is a spring rather than a linear transition — that slight
 * overshoot is what makes a cover feel picked up rather than slid.
 */
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import styles from './CoverGrid.module.css';
import { coverImage, PLANNED_VOLUMES, VOLUME_META, type Volume } from '../data/volumes';
import { useLang } from '../i18n/LanguageProvider';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

type Props = { volumes: Volume[]; loading: boolean };

export function CoverGrid({ volumes, loading }: Props) {
  const { t, to } = useLang();
  const reduced = usePrefersReducedMotion();

  const published = new Map(volumes.map((v) => [v.volume, v]));
  const slots = VOLUME_META.slice(0, PLANNED_VOLUMES);

  const lift = reduced
    ? {}
    : {
        whileHover: { y: -14, rotate: -0.7, scale: 1.035 },
        whileFocus: { y: -14, scale: 1.035 },
        whileTap: { scale: 0.99 },
        transition: { type: 'spring' as const, stiffness: 380, damping: 24 },
      };

  return (
    <ul className={styles.grid} aria-label={t('home.coversLabel')}>
      {slots.map((meta, i) => {
        const volume = published.get(meta.volume);
        const label = t('library.volumeLabel', { n: meta.volume });

        return (
          <motion.li
            key={meta.volume}
            className={styles.tile}
            initial={reduced ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.09, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            {volume ? (
              <motion.div className={styles.sheet} {...lift} style={{ borderTop: `3px solid ${meta.accent}` }}>
                <Link to={to(`/read/${volume.volume}`)} aria-label={`${label} — ${t('library.read')}`}>
                  <img
                    src={coverImage(volume.volume)}
                    alt={label}
                    loading={i < 2 ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                  <span className={styles.badge}>#{meta.volume}</span>
                </Link>
              </motion.div>
            ) : loading ? (
              <div className={styles.skeleton} aria-hidden="true" />
            ) : (
              /* aria-label used to sit on this div and was ignored, because a
                 div has no role for a label to name — so the tile announced
                 only "coming soon", with no clue which volume it meant. The
                 volume number is now real text, hidden from view because the
                 tile is already in the fourth position of a numbered grid. */
              <div className={styles.soon}>
                <span className="sr-only">
                  {t('a11y.comingSoonTile', { n: meta.volume })}
                </span>
                <span aria-hidden="true">{t('library.comingSoon')}</span>
              </div>
            )}
          </motion.li>
        );
      })}
    </ul>
  );
}
