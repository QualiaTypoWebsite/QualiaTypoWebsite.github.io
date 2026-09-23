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
import { useEffect, useRef, useState } from 'react';
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
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Any navigation closes the mobile menu, including hash-only jumps.
  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  /* Escape closes the mobile menu and puts focus back on the button that
     opened it. Without this, a keyboard visitor who opens the menu can only
     leave it by tabbing through every link in it. */
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

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
          ref={toggleRef}
          className={styles.menuToggle}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="primary-nav"
        >
          {t('nav.menu')}
        </button>

        <nav
          id="primary-nav"
          className={`${styles.nav} ${open ? styles.open : ''}`}
          aria-label={t('a11y.mainNav')}
        >
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
            opened in a new tab like any other page.

            lang={other} because everything inside this link is written in the
            language it leads to — "Switch to English" sits in a Greek page and
            "Αλλαγή στα ελληνικά" in an English one. Without it a screen reader
            reads each in the wrong accent, which for Greek in an English voice
            is close to unintelligible. This is WCAG 3.1.2 Language of Parts. */}
        <Link to={mirror} className={styles.langButton} hrefLang={other} lang={other}>
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
