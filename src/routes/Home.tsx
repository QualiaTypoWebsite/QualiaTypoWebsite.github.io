/**
 * The homepage.
 *
 * Two parts stacked vertically:
 *
 *  - The hero, which fills the first screen: the typewriter title and its two
 *    buttons on the left, the 2x2 grid of covers on the right.
 *  - Three scroll sections below it — About the project, About us, Contact —
 *    each with its own pastel wash and each revealed as you scroll to it.
 *
 * The section ids ("about", "group", "contact") are what the top bar's links
 * point at, so renaming one means updating TopBar.tsx too.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './Home.module.css';
import { ButtonLink } from '../components/Button';
import { ContactForm } from '../components/ContactForm';
import { CoverGrid } from '../components/CoverGrid';
import { SectionReveal } from '../components/SectionReveal';
import { TypewriterTitle } from '../components/TypewriterTitle';
import { useVolumes } from '../data/useVolumes';
import { useLang } from '../i18n/LanguageProvider';

/**
 * A hash arriving with the initial navigation has nothing to scroll to yet,
 * because the section is not mounted when the router applies the location.
 */
function useHashScroll() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const target = document.querySelector(hash);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash]);
}

export function Home() {
  const { t, tList, to } = useLang();
  const { volumes, loading } = useVolumes();
  useHashScroll();

  const first = volumes[0];

  return (
    <>
      <div className={styles.hero + ' shell'}>
        <div>
          <p className={styles.tagline}>{t('meta.tagline')}</p>
          <TypewriterTitle />

          <div className={styles.actions}>
            <ButtonLink to={to(`/read/${first?.volume ?? 1}`)} variant="primary">
              {t('home.startReading')}
            </ButtonLink>
            <ButtonLink to={to('/library')} variant="secondary">
              {t('home.browseLibrary')}
            </ButtonLink>
          </div>

          <p className={styles.intro}>{t('home.intro')}</p>

          <a className={styles.scrollHint} href="#about">
            {t('home.scrollHint')} <span aria-hidden="true">↓</span>
          </a>
        </div>

        <div className={styles.covers}>
          <CoverGrid volumes={volumes} loading={loading} />
        </div>
      </div>

      <SectionReveal id="about" className={`${styles.section} ${styles.about}`}>
        <div className={`${styles.sectionInner} shell`}>
          <div>
            <p className="eyebrow">{t('about.eyebrow')}</p>
            <h2 className={styles.sectionTitle}>{t('about.title')}</h2>
          </div>
          <div className={styles.prose}>
            {tList('about.body').map((p) => <p key={p}>{p}</p>)}
          </div>
        </div>
      </SectionReveal>

      <SectionReveal id="group" className={`${styles.section} ${styles.group}`}>
        <div className={`${styles.sectionInner} shell`}>
          <div>
            <p className="eyebrow">{t('group.eyebrow')}</p>
            <h2 className={styles.sectionTitle}>{t('group.title')}</h2>
          </div>
          <div className={styles.prose}>
            {tList('group.body').map((p) => <p key={p}>{p}</p>)}
          </div>
        </div>
      </SectionReveal>

      <SectionReveal id="contact" className={`${styles.section} ${styles.contact}`}>
        <div className={`${styles.sectionInner} shell`}>
          <div>
            <p className="eyebrow">{t('contact.eyebrow')}</p>
            <h2 className={styles.sectionTitle}>{t('contact.title')}</h2>
            <p className={styles.prose} style={{ marginTop: '1rem' }}>{t('contact.intro')}</p>
          </div>
          <ContactForm />
        </div>
      </SectionReveal>
    </>
  );
}
