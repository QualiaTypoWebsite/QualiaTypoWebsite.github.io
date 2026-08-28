/**
 * The site footer: a copyright line, and one dot per volume in that volume's
 * own cover colour — a small nod to the magazine's palette.
 */
import styles from './Footer.module.css';
import { VOLUME_META } from '../data/volumes';
import { useLang } from '../i18n/LanguageProvider';

export function Footer() {
  const { t } = useLang();
  return (
    <footer className={styles.footer}>
      <div className={`${styles.inner} shell`}>
        <span>
          © {new Date().getFullYear()} {t('footer.rights')} · {t('footer.madeWith')}
        </span>
        <span className={styles.dots} aria-hidden="true">
          {VOLUME_META.map((v) => (
            <span key={v.volume} className={styles.dot} style={{ background: v.accent }} />
          ))}
        </span>
      </div>
    </footer>
  );
}
