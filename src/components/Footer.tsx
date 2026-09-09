/**
 * The site footer: a copyright line, and the group's social buttons.
 *
 * It carries id="contact", because the top bar's "Contact" link points here.
 * The site has no contact form and no contact section — reaching us means one
 * of these four links — so the footer is the target, the way it is on most
 * sites.
 *
 * The buttons wear the volume cover colours, which is where the row of volume
 * dots that used to sit here has gone.
 */
import styles from './Footer.module.css';
import { SocialLinks } from './SocialLinks';
import { useLang } from '../i18n/LanguageProvider';

export function Footer() {
  const { t } = useLang();
  return (
    <footer className={styles.footer} id="contact">
      <div className={`${styles.inner} shell`}>
        <span>
          © {new Date().getFullYear()} {t('footer.rights')} · {t('footer.madeWith')}
        </span>
        <div className={styles.social}>
          <span className={styles.findUs}>{t('social.findUs')}</span>
          <SocialLinks />
        </div>
      </div>
    </footer>
  );
}
