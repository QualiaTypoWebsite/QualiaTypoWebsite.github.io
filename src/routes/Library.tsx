/**
 * The library page — every volume as a row with Read and Download buttons.
 *
 * It lists VOLUME_META rather than only the volumes that exist, so a volume
 * that has not been published yet still appears, shown as "coming soon". That
 * is how volume 4 is visible before its PDF exists.
 *
 * Each row sets --accent to its own volume's cover colour, which the row
 * background, border and buttons all pick up automatically.
 */
import { motion } from 'framer-motion';
import styles from './Library.module.css';
import { ButtonAnchor, ButtonLink } from '../components/Button';
import { usePrefersReducedMotion } from '../components/usePrefersReducedMotion';
import { coverImage, pdfHref, VOLUME_META } from '../data/volumes';
import { useVolumes } from '../data/useVolumes';
import { useLang } from '../i18n/LanguageProvider';

export function Library() {
  const { t, to } = useLang();
  const { volumes, loading, error } = useVolumes();
  const reduced = usePrefersReducedMotion();

  const published = new Map(volumes.map((v) => [v.volume, v]));

  return (
    <div className={`${styles.page} shell`}>
      <header className={styles.head}>
        <p className="eyebrow">{t('library.eyebrow')}</p>
        <h1 className={styles.title}>{t('library.title')}</h1>
        <p className={styles.subtitle}>{t('library.subtitle')}</p>
      </header>

      {error && <p className={styles.error}>{t('reader.notFound')}</p>}

      <ul className={styles.list}>
        {VOLUME_META.map((meta, i) => {
          const volume = published.get(meta.volume);
          const label = t('library.volumeLabel', { n: meta.volume });

          return (
            <motion.li
              key={meta.volume}
              className={`${styles.row} ${volume ? '' : styles.soonRow}`}
              style={{ '--accent': meta.accent } as React.CSSProperties}
              initial={reduced ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {volume ? (
                <>
                  <span className={styles.cover}>
                    <img src={coverImage(volume.volume)} alt={label} loading="lazy" decoding="async" />
                  </span>
                  <div>
                    <p className={styles.volNumber}>{label}</p>
                    <h2 className={styles.volTitle}>Qualia Typo #{volume.volume}</h2>
                    <p className={styles.meta}>
                      {volume.year} · {t('library.pages', { count: volume.pages })}
                    </p>
                    <div className={styles.rowActions}>
                      <ButtonLink to={to(`/read/${volume.volume}`)}>{t('library.read')}</ButtonLink>
                      <ButtonAnchor
                        href={pdfHref(volume)}
                        download
                        variant="quiet"
                      >
                        {t('library.download')}
                      </ButtonAnchor>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <span className={styles.soonCover}>{t('library.comingSoon')}</span>
                  <div>
                    <p className={styles.volNumber}>{label}</p>
                    <h2 className={styles.volTitle}>Qualia Typo #{meta.volume}</h2>
                    <p className={styles.meta}>
                      {loading ? '…' : t('library.comingSoonNote')}
                    </p>
                  </div>
                </>
              )}
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
