/**
 * The homepage.
 *
 * Two parts stacked vertically:
 *
 *  - The hero, which fills the first screen: the typewriter title and its two
 *    buttons on the left, the 2x2 grid of covers on the right.
 *  - Two scroll sections below it — About the project and About us — on the
 *    plain paper colour, each revealed as you scroll to it. About
 *    the project ends with the places a printed copy can be picked up
 *    (VenueList) and the funding acknowledgement.
 *
 * The prose paragraphs go through RichText, so a phrase wrapped in **double
 * asterisks** in the i18n files is shown in bold (see src/i18n/emphasis.ts).
 * The venue names do not: they are names, not prose.
 *
 * The section ids ("about", "group") are what two of the top bar's links point
 * at, so renaming one means updating TopBar.tsx too. The bar's third link,
 * Contact, points at the footer, which is where the social buttons live.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './Home.module.css';
import { ButtonLink } from '../components/Button';
import { CoverGrid } from '../components/CoverGrid';
import { RichText } from '../components/RichText';
import { SectionReveal } from '../components/SectionReveal';
import { TypewriterTitle } from '../components/TypewriterTitle';
import { VenueList } from '../components/VenueList';
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

          <p className={styles.intro}><RichText text={t('home.intro')} /></p>

          <a className={styles.scrollHint} href="#about">
            {t('home.scrollHint')} <span aria-hidden="true">↓</span>
          </a>
        </div>

        <div className={styles.covers}>
          <CoverGrid volumes={volumes} loading={loading} />
        </div>
      </div>

      <SectionReveal id="about" className={styles.section}>
        <div className={`${styles.sectionInner} shell`}>
          <div>
            <p className="eyebrow">{t('about.eyebrow')}</p>
            <h2 className={styles.sectionTitle}>{t('about.title')}</h2>
          </div>
          <div className={styles.prose}>
            {tList('about.body').map((p) => <p key={p}><RichText text={p} /></p>)}
            {/* Where to pick up a printed copy: the sentence introducing the
                list, the list itself, then the funding acknowledgement. */}
            <p><RichText text={t('about.venuesIntro')} /></p>
            <VenueList venues={tList('about.venues')} />
            <p><RichText text={t('about.funding')} /></p>
          </div>
        </div>
      </SectionReveal>

      <SectionReveal id="group" className={styles.section}>
        <div className={`${styles.sectionInner} shell`}>
          <div>
            <p className="eyebrow">{t('group.eyebrow')}</p>
            <h2 className={styles.sectionTitle}>{t('group.title')}</h2>
          </div>
          <div className={styles.prose}>
            {tList('group.body').map((p) => <p key={p}><RichText text={p} /></p>)}
          </div>
        </div>
      </SectionReveal>
    </>
  );
}
