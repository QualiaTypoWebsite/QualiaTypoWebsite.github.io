/**
 * The sticky header, present on every page.
 *
 * Contains the wordmark, three section links, a link to the library, and the
 * language flag.
 *
 * The section links always point at the homepage plus a hash (e.g. "/#about"),
 * so they work from the library or the reader too, not just from the homepage.
 *
 * The flag is a <Link>, not a <button>, on purpose: the other language is a
 * real URL, so it should be openable in a new tab and readable by search
 * engines like any other link.
 */
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import styles from './TopBar.module.css';
import { GreekFlag, UkFlag } from './Flags';
import { Logo } from './Logo';
import { useLang } from '../i18n/LanguageProvider';

/**
 * Hash targets, not routes; the library is its own route. "about" and "group"
 * are homepage sections, while "contact" is the footer — the site has no
 * contact section, only the social buttons down there.
 */
const SECTIONS = ['about', 'group', 'contact'] as const;

export function TopBar() {
  const { t, to, mirror, other } = useLang();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Any navigation closes the mobile menu, including hash-only jumps.
  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  const home = to('/');

  return (
    <header className={`${styles.bar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <Link to={home} className={styles.brand}>
          <Logo />
          <span>Qualia&nbsp;Typo</span>
        </Link>

        <button
          type="button"
          className={styles.menuToggle}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="primary-nav"
        >
          {t('nav.menu')}
        </button>

        <nav id="primary-nav" className={`${styles.nav} ${open ? styles.open : ''}`}>
          {SECTIONS.map((section) => (
            <Link key={section} to={`${home}#${section}`} className={styles.link}>
              {t(`nav.${section}`)}
            </Link>
          ))}
          <NavLink
            to={to('/library')}
            className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
          >
            {t('nav.library')}
          </NavLink>
        </nav>

        {/* A link, not a button, so the other language is crawlable and can be
            opened in a new tab like any other page. */}
        <Link to={mirror} className={styles.langButton} hrefLang={other}>
          {other === 'en' ? (
            <UkFlag title={t('nav.switchLanguage')} />
          ) : (
            <GreekFlag title={t('nav.switchLanguage')} />
          )}
          <span>{other === 'en' ? 'EN' : 'ΕΛ'}</span>
        </Link>
      </div>
    </header>
  );
}
